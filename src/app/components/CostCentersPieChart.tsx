"use client";
import React, { useState, useMemo, useEffect } from "react";
import { api } from "@/app/fetcher";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card } from "antd";
import {
  DatePicker as DatePickerJalali,
  jalaliPlugin,
  useJalaliLocaleListener,
} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

dayjs.extend(jalaliPlugin);
dayjs.locale("fa");
dayjs["calendar"]("jalali");

function toPersianNumbers(str) {
  if (str == null) return "";
  const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return str.toString().replace(/[0-9]/g, (w) => persianNumbers[+w]);
}

interface Organization {
  id: number;
  name: string;
}

const COLORS = [
  "#0088FE",
  "#07af90",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#00B0F0",
  "#00B050",
  "#EF1DB8",
  "#7030A0",
  "#C00000",
];

export default function CostCentersPieChart({ year = null }) {
  useJalaliLocaleListener();

  const [form_date, set_form_date] = useState(dayjs(new Date()));
  const [organization, setOrganization] = useState([]);
  const [loading, setLoading] = useState(false);

  const Year = form_date.format("YYYY");

  useEffect(() => {
    setLoading(true);
    api()
      .url("/api/organization?no_pagination=true" + `&year=${Year}`)
      .get()
      .json()
      .then(async (orgs: Organization[]) => {
        const orgsWithTotals = await Promise.all(
          orgs.map(async (org) => {
            try {
              const response: { total_price: number } = await api()
                .url(
                  `/api/logistics/total_price?date_doc_jalali_year=${Year}&Location__unit__organization=${org.id}`
                )
                .get()
                .json();
              return { ...org, M_price: response.total_price || 0 };
            } catch (error) {
              return { ...org, M_price: 0 };
            }
          })
        );
        setOrganization(orgsWithTotals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [form_date]);

  const totalSum = useMemo(() => {
    return organization.reduce((sum, org) => sum + (org.M_price || 0), 0);
  }, [organization]);

  const pieChartData = useMemo(() => {
    return organization
      .filter((org) => org.M_price > 0)
      .map((org) => ({
        name: org.name,
        value: org.M_price,
        percentage: totalSum > 0 ? (org.M_price / totalSum) * 100 : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [organization, totalSum]);

  return (
    <Card
      title={`نمودار درصد هزینه کرد از مجموع (${toPersianNumbers(numberWithCommas(totalSum))} ریال) در سال`}
      className="text-center mb-5"
      loading={loading}
    >
      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name, props) => [
                toPersianNumbers(numberWithCommas(value)) + " ریال",
                `${name}: ${toPersianNumbers(
                  numberWithCommas(props.payload.percentage.toFixed(1))
                )}%`,
              ]}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              formatter={(value, entry, index) => {
                const data = pieChartData[index];
                const formattedValue =
                  toPersianNumbers(numberWithCommas(data.value)) + " ریال";
                const percentage = `${toPersianNumbers(data.percentage.toFixed(1))}%`;
                return (
                  <span style={{ marginRight: "8px" }}>
                    {value}: {formattedValue} - ({percentage})
                  </span>
                );
              }}
              iconType="circle"
              wrapperStyle={{
                fontSize: "15px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          <span className={"h2 text-black"}> انتخاب سال : </span>
          <DatePickerJalali
            picker="year"
            value={form_date}
            onChange={(e) => set_form_date(e)}
          />
        </div>
      </div>
    </Card>
  );
}
