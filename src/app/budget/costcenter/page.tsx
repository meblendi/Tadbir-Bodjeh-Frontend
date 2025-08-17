"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/app/fetcher";
import { Button, Modal, Space, Table } from "antd";
import Costcenter_doc from "@/app/budget/costcenter/costcenter";
import { PlusOutlined } from "@ant-design/icons";
import {
  DatePicker as DatePickerJalali,
  jalaliPlugin,
  useJalaliLocaleListener,
} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

export type cost_doc = {
  type: number;
  id: number;
  name: string;
  title: string;
  rel_id?: number;
  code?: number;
  year?: number;
  // data?:
};
export default function Program() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selected_data, setselected_data] = useState<cost_doc>();
  const [loading, setLoading] = useState(false);
  const [tableParams, setTableParams] = useState({
    pagination: {
      current: 1,
      pageSize: 15,
      total: 10,
    },
  });
  const [update, set_update] = useState(0);
  useJalaliLocaleListener();
  dayjs.extend(jalaliPlugin);
  dayjs.locale("fa"); // Set the locale to Persian/Farsi
  dayjs["calendar"]("jalali");
  const [form_date, set_form_date] = useState(dayjs(new Date()));
  const fetchData = () => {
    setLoading(true);
    let Year = dayjs(form_date).format("YYYY");
    api()
      .url(
        `/api/organization?page=${tableParams.pagination.current}&year=${Year}`
      )
      .get()
      .json()
      .then((res) => {
        console.log(res);
        setData(res["results"]);
        setLoading(false);
        setTableParams({
          ...tableParams,
          pagination: {
            ...tableParams.pagination,
            total: res["count"],
            // total: data.totalCount,
          },
        });
      });
  };
  useEffect(() => {
    fetchData();
    // console.log("useEffect");
  }, [update, JSON.stringify(tableParams), form_date]);
  const handleModalChange = (newState) => {
    setIsModalOpen(newState);
  };
  const showModal = (data: cost_doc) => {
    console.log(data);
    setselected_data(data);
    setIsModalOpen(true);
  };
  const handleUpdate = () => {
    setIsModalOpen(!isModalOpen);
    set_update(update + 1);
    console.log(update + "fffffffffffffffffffffffffffffffffffffff");
  };
  const handleOk = () => {
    setIsModalOpen(false);
  };
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  const handleTableChange = (pagination, filters, sorter) => {
    setTableParams({
      pagination,
      filters,
      ...sorter,
    });
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
      title: "معاونت/دانشکده",
      dataIndex: "name",
      key: "name",
      render: (name, rec) => (
        <a
          onClick={() =>
            showModal({
              type: 0,
              id: rec.id,
              name: rec.name,
              title: "معاونت/ دانشکده",
              code: rec.code,
              year: rec.year,
            })
          }
        >
          {name}
        </a>
      ),
    },
    {
      title: "واحد",
      dataIndex: "unit",
      key: "unit",
      render: (units) => (
        <ul>
          {units.map((unit) => (
            <li key={unit.id}>
              <a
                onClick={() =>
                  showModal({
                    type: 1,
                    id: unit.id,
                    name: unit.name,
                    rel_id: unit.organization,
                    title: "واحد",
                    code: unit.code,
                    year: unit.year,
                  })
                }
              >
                {unit.name}
              </a>
            </li>
          ))}
        </ul>
      ),
    },
    {
      title: "واحد تابعه",
      dataIndex: "unit",
      key: "sub_unit",
      render: (units) => (
        <ul>
          {units.map((unit) =>
            unit.sub_unit.map((subUnit) => (
              <li key={subUnit.id}>
                <a
                  onClick={() =>
                    showModal({
                      type: 2,
                      id: subUnit.id,
                      name: subUnit.name,
                      rel_id: subUnit.unit,
                      title: "واحد تابعه",
                      code: subUnit.code,
                      year: subUnit.year,
                    })
                  }
                >
                  {subUnit.name}
                </a>
              </li>
            ))
          )}
        </ul>
      ),
    },
  ];
  return (
    <div>
      <div className={"py-2"}>
        <span className={"h1 "}> مراکز هزینه</span>
        <span className={"float-end"}>
          <span className={"h2"}> انتخاب سال </span>
          <DatePickerJalali
            picker="year"
            // defaultValue={"1403"}
            defaultValue={form_date}
            onChange={(e) => {
              set_form_date(e);
            }}
          />
        </span>
      </div>

      <Modal
        title={selected_data?.title}
        style={{ marginLeft: "-15%" }}
        centered
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={null}
        zIndex={100}
        width={"75%"}
      >
        <Costcenter_doc
          data={selected_data}
          key={JSON.stringify(selected_data)}
          onOk={handleUpdate}
          onCancel={handleCancel}
        />
      </Modal>
      <Space>
        <Button
          type="primary"
          size="middle"
          icon={<PlusOutlined />}
          // style={{background: 'linear-gradient(to right, #6a11cb, #2575fc)', border: 'none'}}
          onClick={() =>
            showModal({
              name: "",
              type: 0,
              id: null,
              title: "معاونت/دانشکده",
            })
          }
        >
          ایجاد معاونت/دانشکده
        </Button>
        <Button
          type="primary"
          size="middle"
          icon={<PlusOutlined />}
          // style={{background: 'linear-gradient(to right, #43e97b, #38f9d7)', border: 'none'}}
          onClick={() =>
            showModal({
              name: "",
              type: 1,
              id: null,
              title: "واحد",
            })
          }
        >
          ایجاد واحد
        </Button>
        <Button
          type="primary"
          size="middle"
          icon={<PlusOutlined />}
          // style={{background: 'linear-gradient(to right, #ff7e5f, #feb47b)', border: 'none'}}
          onClick={() =>
            showModal({
              name: "",
              type: 2,
              id: null,
              title: "واحد تابعه",
            })
          }
        >
          ایجاد واحد تابعه
        </Button>
      </Space>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={tableParams.pagination}
        loading={loading}
        onChange={handleTableChange}
      />
    </div>
  );
}
