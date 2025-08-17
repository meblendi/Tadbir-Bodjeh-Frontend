"use client";

import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import {Button, Col, Form, Input, InputNumber, message, Row, Select} from "antd";
import dayjs from "dayjs";
import React, {useEffect, useState} from "react";
import Cookies from "js-cookie";

export type FormData = {
    name: string;
    price: number;
    doc_num: string;
    date_doc: any;
    CostType: number;
    descr: string;
    L_conf: boolean | null;
    F_conf: boolean | null;
    forwhom?: number; // Add the forwhom property here
};
export type User = {
    id: number;
    name: string;
    // Add other user properties as needed
};

export default function Tankhah(prop: { Fdata: any, selectedid: number, modal: any }) {
    const [form] = Form.useForm();
    const [users, set_users] = useState<User[] | undefined>(undefined);
    const [show_user_selector, set_Show_user_selector] = useState(Cookies.get("group") == "financial" || Cookies.get("admin") == "true");
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs["calendar"]('jalali');

    let data = prop.Fdata ? prop.Fdata.filter((item) => item.id === prop.selectedid)[0] : null
    useEffect(() => {
        if (show_user_selector)
            api().url(`/api/getAllLogisticUser/`).get().json<User[]>().then((res) => {
                console.log(res)
                set_users(res)
            })


        if (prop.Fdata) {
            // console
            prop.Fdata.filter((item) => {
                if (item.id === prop.selectedid) {


                    form.setFieldsValue({
                        name: item.name,
                        doc_num: item.doc_num,
                        price: item.price,
                        date_doc: dayjs(new Date(item.date_doc)),
                        descr: item.descr,
                        forwhom: item.forwhom && item.forwhom.name,
                    })
                }
            })
        }
    }, [prop.selectedid])

    function updateData(data) {
        console.log(data)
        prop.Fdata.filter((item) => {
            if (item.id === prop.selectedid) {
                item.name = data.name
                item.doc_num = data.doc_num
                item.price = data.price
                item.date_doc = data.date_doc
                item.descr = data.descr
                if (show_user_selector) {
                    item.forwhom = {"id": data.forwhom.value, "name": data.forwhom.label}
                }

            }
        })
    }

    const onFinish = (values) => {
        let jsondata: FormData = {
            "name": values.name,
            "price": values.price,
            "doc_num": values.doc_num,
            "date_doc": values.date_doc,
            "CostType": values.price,
            "descr": values.descr,
            // "forwhom": show_user_selector ? values.forwhom.value : null,
            "L_conf": null,
            "F_conf": null,
            // "forwhom": "",
        }
        if (Cookies.get("group")) {
            console.log(Cookies.get("group"))
            if (Cookies.get("group").startsWith("logistics")) {
                jsondata = {...jsondata, "L_conf": true}
            } else if (Cookies.get("group").startsWith("financial")) {
                jsondata = {...jsondata, "F_conf": true}
            }


        }
        if (show_user_selector) {
            jsondata = {...jsondata, 'forwhom': values.forwhom.value}
        }
        const request = prop.selectedid ? api().url(`/api/pettycash/${prop.selectedid}/`).put(jsondata).json() : api().url(`/api/pettycash/`).post(jsondata).json()
        request.catch((err) => {
            console.log(err.error)
            message.error("خطا در ثبت سند")
        })
        request.then((res) => {
            prop.selectedid && updateData(values)
            message.success("سند با موفقیت ثبت شد")
            prop.selectedid && prop.modal(false)
            !prop.selectedid && form.resetFields();
        })

    }
    const [form_date, set_form_date] = useState(dayjs(new Date()).locale('jalali'));
    return (<Form
        form={form}
        autoComplete="off"
        onFinish={onFinish}
        initialValues={{
            date_doc: form_date,
        }}
    >
        <Row gutter={50}>
            <Col span={8}>
                <Form.Item
                    name="name"
                    label="عنوان"
                    rules={[{
                        required: true,
                        message: "نام سند را وارد نمایید",
                    },]}
                >
                    <Input/>
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item
                    name="doc_num"
                    label="شماره سند"
                    rules={[{
                        // required: true,
                        message: "شماره سند را وارد نمایید",
                    },]}
                >
                    <Input/>
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name="date_doc" label="تاریخ">
                    <DatePickerJalali
                        // value={form_date}
                        // defaultValue={form_date}
                        onChange={e => {
                            set_form_date(e)
                        }
                        }
                    />
                </Form.Item>
            </Col>

        </Row>
        <Row gutter={50}>

            <Col span={8}>
                <Form.Item
                    name="price"
                    label="مبلغ"
                    rules={[
                        {
                            required: true,
                            type: "number",
                            min: 0,
                        },
                    ]}
                >
                    <InputNumber
                        addonAfter={"﷼"}
                        formatter={(value: string) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={(value) => value?.replace(/\$\s?|(,*)/g, '')}
                        style={{width: "100%"}}
                    />
                </Form.Item>
            </Col>
            {show_user_selector &&

                <Col span={8}>
                    <Form.Item
                        name="forwhom"
                        label="انتخاب کارپرداز"
                        rules={
                            [{
                                required: true,
                            }]
                        }
                        // labelCol={{span: 4}}
                        // wrapperCol={{span: 16}}
                    >
                        <Select
                            labelInValue
                            // allowClear={true}
                            autoClearSearchValue={true}
                            placeholder="انتخاب کارپرداز"
                            // showSearch={true}
                            // value={value}

                            // notFoundContent={fetching ? <Spin size="small"/> : null}
                            options={users?.map((user) => ({value: user.id, label: user.name}))}

                        />


                    </Form.Item>
                </Col>}
        </Row>
        <Row gutter={50}>

        </Row>
        <Row>
            <Col span={21}>
                <Form.Item
                    name="descr"
                    label="توضیحات"
                    // labelCol={{span: 4}}
                    // wrapperCol={{span: 16}}
                >
                    <Input.TextArea/>
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={50}>

        </Row>

        <Form.Item
            wrapperCol={{
                // labelAlign: "left",
                offset: 8,
            }}
        >
            <Button type="primary" htmlType="submit" disabled={
                data ? Cookies.get("group").startsWith("logistics") ? data.F_conf !== null : Cookies.get("group").startsWith("financial") ? data.L_conf !== null : true : false
            }>
                {prop.Fdata ? "ویرایش تنخواه" : "ایجاد تنخواه"}
            </Button>
        </Form.Item>
    </Form>)
}