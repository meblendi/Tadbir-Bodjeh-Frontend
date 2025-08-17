"use client";
import { Button, Form, FormProps, Select } from "antd";
import React, { useEffect, useState } from "react";
import { api } from "@/app/fetcher";
import {
  DatePicker as DatePickerJalali,
  jalaliPlugin,
  useJalaliLocaleListener,
} from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import { RelationData } from "@/app/budget/relation/page";

export default function Relation({
  data,
  onOk,
  onCancel,
}: {
  data: RelationData;
  onOk?: (b: boolean) => void;
  onCancel?: () => void;
}) {
  const editmode = data.id !== null;
  const [location, setlocation] = useState([]);
  const [prgrams, set_programs] = useState([]);
  const [budget_row, set_budget_row] = useState([]);

  const [form] = Form.useForm();
  useJalaliLocaleListener();
  dayjs.extend(jalaliPlugin);
  dayjs.locale("fa"); // Set the locale to Persian/Farsi
  dayjs["calendar"]("jalali");
  const [form_date, set_form_date] = useState(dayjs(new Date()));
  type FieldType = {
    name?: string;
    year?: string;
    programs?: number[];
    // cost_type?: string;
    Location?: string[];
    budget_row?: number;
  };
  useEffect(() => {
    let Year = dayjs(form_date).format("YYYY");
    // console.log(url)
    api()
      .url("/api/organization?no_pagination=true&year=" + Year)
      .get()
      .json<any[]>()
      .then((r) => {
        // console.log(r)
        setlocation(r);
      });
    api()
      .url("/api/program?no_pagination=true&year=" + Year)
      .get()
      .json<any[]>()
      .then((r) => {
        // console.log(r)
        set_programs(r);
      });
    api()
      .url("/api/budget_row?no_pagination=true&year=" + Year)
      .get()
      .json<any[]>()
      .then((r) => {
        // console.log(r)
        set_budget_row(r);
      });
  }, [form_date]);

  const onFinish: FormProps<FieldType>["onFinish"] = (values) => {
    console.log("Success:", values);
    //to persian year number
    let yearPicker = dayjs(values.year).format("YYYY");
    if (editmode) {
      api()
        .url("/api/relation/" + data.id + "/")
        .put({
          year: yearPicker,
          // cost_type: values.cost_type,
          budget_row: values.budget_row,
          organization: values.Location,
          programs: values.programs,

          // rel_id: values.Location
        })
        .json()
        .then((r) => {
          console.log(r);
          form.resetFields();
          onOk(true);
        });
    } else {
      api()
        .url("/api/relation/")
        .post({
          year: yearPicker,
          // cost_type: values.cost_type,
          budget_row: values.budget_row,
          organization: values.Location,
          programs: values.programs,

          // rel_id: values.Location
        })
        .json()
        .then((r) => {
          console.log(r);
          form.resetFields();
          onOk(true);
        });
    }
  };

  const filterOption = (input, option) =>
    (option?.label ?? "").toLowerCase().includes(input.toLowerCase());
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };

  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{
        year: data?.year
          ? dayjs().year(Number(data?.year)).month(1).day(1)
          : form_date,
        Location: data?.organization?.map((i) => i.id) ?? [],
        cost_type: data?.cost_type ?? undefined,
        programs: data?.programs?.map((i) => i.id) ?? [],
        budget_row: data?.budget_row?.id ?? undefined,
      }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
      form={form}
    >
      <Form.Item
        label="سال"
        name="year"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <DatePickerJalali
          picker="year"
          // defaultValue={"1403"}
          // defaultValue={form_date}
          onChange={(e) => {
            set_form_date(e);
          }}
        />
      </Form.Item>

      <Form.Item
        label="ردیف هزینه"
        name="budget_row"
        rules={[{ required: true, message: "Please input your username!" }]}
      >
        <Select
          showSearch
          filterOption={filterOption}
          placeholder={" انتخاب ردیف هزینه"}
          options={budget_row.map((item) => ({
            label: `${item.code} - ${item.fin_code} - ${item.name}`,
            value: item.id,
          }))}
        />
      </Form.Item>

      <Form.Item
        name="programs"
        label={"انتخاب برنامه"}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          showSearch
          filterOption={filterOption}
          placeholder={" انتخاب برنامه"}          
          mode="multiple"
          options={prgrams.map((item) => {
            return { label: item.name, value: item.id };
          })}
        />
      </Form.Item>

      <Form.Item
        name="Location"
        label={"انتخاب محل هزینه"}
        rules={[
          {
            required: true,
          },
        ]}
      >
        <Select
          showSearch
          filterOption={filterOption}
          placeholder={" انتخاب واحد مربوطه"}
          // optionFilterProp="children"
          // onChange={onChange}
          // onSearch={onSearch}
          mode="multiple"
          options={location.map((item) => {
            return { label: item.name, value: item.id };
          })}
        />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          {editmode ? "ویرایش" : "ایجاد"}
        </Button>
      </Form.Item>
    </Form>
  );
}
