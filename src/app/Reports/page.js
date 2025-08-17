"use client";
import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/app/fetcher";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import { Table, Col, Form, InputNumber } from "antd";
import {
  DatePicker as DatePickerJalali,
  jalaliPlugin,
  useJalaliLocaleListener,
} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

function toPersianNumbers(str) {
  if (str == null) {
    // Handle null or undefined values
    return '';
  }

  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.toString().replace(/[0-9]/g, function (w) {
    return persianNumbers[+w];
  });
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#A2D9CE', '#D2B4DE', '#F5B7B1'];

export default function Program() {
  const [loading, setLoading] = useState(false);
  const [get_nulls, set_get_nulls] = useState("false");
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [organization, setorganization] = useState([]);

  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 15,
      total: 0,
    },
  });

  useJalaliLocaleListener();
  dayjs.extend(jalaliPlugin);
  dayjs.locale("fa");
  dayjs["calendar"]("jalali");
  const [form_date, set_form_date] = useState(dayjs(new Date()));

  // Fetch organizations
  useEffect(() => {
    setLoading(true);
    let Year = form_date.format("YYYY");

    // First fetch all organizations
    api()
      .url("/api/organization?no_pagination=true" + `&year=${Year}`)
      .get()
      .json()
      .then(async (orgs) => {
        // Fetch logistics totals for each organization
        const orgsWithTotals = await Promise.all(
          orgs.map(async (org) => {
            try {
              // Get total for the organization (all units and sub_units under this org)
              const response = await api()
                .url(`/api/logistics/total_price?date_doc_jalali_year=${Year}&Location__unit__organization=${org.id}&get_nulls=${get_nulls}`)
                .get()
                .json();

              return {
                ...org,
                units: [], // Initialize empty units array
                M_price: response.total_price || 0
              };
            } catch (error) {
              console.error("Error fetching logistics total for organization:", error);
              return {
                ...org,
                units: [],
                M_price: 0
              };
            }
          })
        );

        setorganization(orgsWithTotals);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: orgs.length,
          },
        });
      })
      .catch(() => {
        setLoading(false);
      });
  }, [form_date, get_nulls]);

  const handleOrgExpand = async (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.id]);
      const Year = form_date.format("YYYY");

      const units = await api()
        .url(`/api/unit?no_pagination=true&year=${Year}&organization=${record.id}`)
        .get()
        .json();

      // Fetch logistics totals for each unit
      const unitsWithTotals = await Promise.all(
        units.map(async (unit) => {
          try {
            // Get total for the unit itself (all sub_units under this unit)
            const response = await api()
              .url(`/api/logistics/total_price?date_doc_jalali_year=${Year}&Location__unit=${unit.id}&get_nulls=${get_nulls}`)
              .get()
              .json();

            return {
              ...unit,
              subunits: [], // Initialize empty subunits array
              V_price: response.total_price || 0
            };
          } catch (error) {
            console.error("Error fetching logistics total for unit:", error);
            return {
              ...unit,
              subunits: [],
              V_price: 0
            };
          }
        })
      );

      setorganization((prev) =>
        prev.map((org) =>
          org.id === record.id ? { ...org, units: unitsWithTotals } : org
        )
      );
    } else {
      setExpandedRowKeys(expandedRowKeys.filter((key) => key !== record.id));
    }
  };

  const handleUnitExpand = async (expanded, orgId, unitRecord) => {
    if (expanded) {
      const Year = form_date.format("YYYY");

      const subunits = await api()
        .url(`/api/subUnit?no_pagination=true&year=${Year}&unit=${unitRecord.id}`)
        .get()
        .json();

      // Fetch logistics totals for each sub_unit
      const subunitsWithTotals = await Promise.all(
        subunits.map(async (subunit) => {
          try {
            const response = await api()
              .url(`/api/logistics/total_price?date_doc_jalali_year=${Year}&Location=${subunit.id}&get_nulls=${get_nulls}`)
              .get()
              .json();
            return {
              ...subunit,
              T_price: response.total_price || 0
            };
          } catch (error) {
            console.error("Error fetching logistics total:", error);
            return {
              ...subunit,
              T_price: 0
            };
          }
        })
      );

      setorganization((prev) =>
        prev.map((org) =>
          org.id === orgId
            ? {
              ...org,
              units: org.units.map((unit) =>
                unit.id === unitRecord.id
                  ? { ...unit, subunits: subunitsWithTotals }
                  : unit
              ),
            }
            : org
        )
      );
    }
  };

  const columns = [
    {
      title: "ردیف",
      key: "number",
      render: (text, record, index) =>
        index +
        1 +
        (tableParams.pagination.current - 1) * tableParams.pagination.pageSize,
    },
    {
      title: "مراکز هزینه",
      dataIndex: "name",
      key: "name",
      render: (text) => (
        <span style={{
          color: "blue", fontSize: "16px", //fontWeight: "bold" 
        }}>
          {text}
        </span>
      ),

    },
    {
      title: "هزینه کرد",
      dataIndex: "M_price",
      key: "M_price",
      sorter: (a, b) => b.M_price - a.M_price,
      render: (text, record) => {
        // If M_price is already provided, use it
        if (text) return <span style={{ color: "blue", fontSize: "16px", }}>{toPersianNumbers(numberWithCommas(text))}</span>;

        // Otherwise, show loading or empty state
        return <span style={{ color: "red", fontSize: "16px", }} className="loading-price">۰</span>;
      },
    },
  ];

  const unitColumns = [
    {
      // title: "ردیف",
      key: "number",
      render: (text, record, index) => index + 1,
    },
    {
      // title: "واحدها",
      dataIndex: "name",
      key: "unit_name",
      render: (text) => <span style={{ color: "green", fontSize: "15px", }}>{text}</span>,
    },
    {
      // title: "هزینه کرد",
      dataIndex: "V_price",
      key: "V_price",
      render: (text, record) => {
        // If V_price is already provided, use it
        if (text) return <span style={{ color: "green", fontSize: "15px", }}>{toPersianNumbers(numberWithCommas(text))}</span>;

        // Otherwise, show loading or empty state
        return <span style={{ color: "red", fontSize: "15px", }} className="loading-price">۰</span>;
      },
    },
  ];

  const subunitColumns = [
    {
      // title: "ردیف",
      key: "number",
      render: (text, record, index) => index + 1,
    },
    {
      // title: "واحد تابعه",
      dataIndex: "name",
      key: "sub_unit_name",
    },
    {
      // title: "هزینه کرد",
      dataIndex: "T_price",
      key: "T_price",
      render: (text, record) => {
        // If T_price is already provided, use it
        if (text) return toPersianNumbers(numberWithCommas(text));

        // Otherwise, we'll fetch the logistics total for this sub_unit
        return <span style={{ color: "red" }} className="loading-price">۰</span>;
      },
    },
  ];

  const totalSum = useMemo(() => {
    return organization.reduce((sum, org) => sum + (org.M_price || 0), 0);
  }, [organization]);
  
  return (
    <>
      <div>
        <div className={"py-2 pb-5"}>
          <span className={"float-end"}>
            <span className={"h2 text-black"}> انتخاب سال : </span>
            <DatePickerJalali
              picker="year"
              defaultValue={form_date}
              onChange={(e) => {
                set_form_date(e);
              }}
            />
          </span>
          <span className={"h1 text-black mb-5"}><b>مراکز هزینه</b></span>
        </div>
        <Col span={8}><Form.Item label="جمع هزینه کرد">
          <InputNumber
            value={totalSum}
            addonAfter={"﷼"}
            formatter={(value) => toPersianNumbers(numberWithCommas(Math.floor(value)))}
            style={{ width: "100%" }}
            readOnly
          />
        </Form.Item></Col>        
        <Table
          columns={columns}
          dataSource={organization}
          rowKey="id"
          pagination={false}
          loading={loading}
          expandable={{
            expandedRowRender: (record) => (
              <Table
                columns={unitColumns}
                dataSource={record.units || []}
                rowKey="id"
                pagination={false}
                expandable={{
                  expandedRowRender: (unitRecord) => (
                    <Table
                      columns={subunitColumns}
                      dataSource={unitRecord.subunits || []}
                      rowKey="id"
                      pagination={false}
                    />
                  ),
                  rowExpandable: () => true,
                  onExpand: (expanded, unitRecord) =>
                    handleUnitExpand(expanded, record.id, unitRecord),
                }}
              />
            ),
            rowExpandable: () => true,
            onExpand: handleOrgExpand,
            expandedRowKeys: expandedRowKeys,
          }}
        />
      </div>
    </>
  );
}
