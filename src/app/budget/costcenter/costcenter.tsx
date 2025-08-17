"use client";

import {Button, Form, FormProps, Input, Select} from "antd";
import {cost_doc} from "@/app/budget/costcenter/page";
import React, {useEffect, useState} from "react";
import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

export default function Costcenter_doc({data, onOk, onCancel}: {
    data: cost_doc,
    onOk?: (b: boolean) => void,
    onCancel?: () => void
}) {
    const editmode = data.id !== null
    const [location, setlocation] = useState([]);
    const [form] = Form.useForm()
    const label = data?.type === 1 ? "معاونت/دانشکده" : "واحد";
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa'); // Set the locale to Persian/Farsi
    dayjs["calendar"]('jalali');
    // @ts-ignore
    const [form_date, set_form_date] = useState(dayjs(new Date(), {"jalali": true}))
    type FieldType = {
        name?: string;
        Location?: number;
        year?: string;
        code?: number;
    };
    useEffect(() => {
        if (data?.type !== 0) {
            form.setFieldsValue({Location: data.rel_id == null ? "" : data.rel_id})
            let Year = dayjs(form_date).format("YYYY");
            let url = data?.type == 1 ? "/api/organization?no_pagination=true&year=" + Year : "/api/unit?no_pagination=true&year=" + Year
            // console.log(url)
            api().url(url).get().json<any[]>().then(r => {
                // console.log(r)
                setlocation(r)
            })
        }


    }, [form_date]);
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        console.log('Success:', values);
        let yearPicker = dayjs(values.year).format("YYYY");
        if (editmode) {
            switch (data?.type) {
                case 0:
                    api().url("/api/organization/" + data.id + "/").put({
                        name: values.name,
                        rel_id: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {
                        console.log(r)
                        form.resetFields()
                        onOk(true)
                    })
                    break;
                case 1:
                    api().url("/api/unit/" + data.id + "/").put({
                        name: values.name,
                        organization: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {
                        console.log(r)
                        form.resetFields()
                        onOk(true)
                    })
                    break;
                case 2:
                    api().url("/api/subUnit/" + data.id + "/").put({
                        name: values.name,
                        unit: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {

                        onOk(true)
                        form.resetFields()
                    })


            }


        } else {
            switch (data?.type) {
                case 0:
                    api().url("/api/organization/").post({
                        name: values.name,
                        rel_id: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {
                        onOk(true)
                        console.log(r)
                        form.resetFields()
                    })
                    break;
                case 1:
                    api().url("/api/unit/").post({
                        name: values.name,
                        organization: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {
                        onOk(true)
                        console.log(r)
                        form.resetFields()
                    })
                    break;
                case 2:
                    api().url("/api/subUnit/").post({
                        name: values.name,
                        unit: values.Location,
                        year: yearPicker,
                        code: values.code
                    }).json().then(r => {
                        onOk(true)
                        form.resetFields()
                    })
            }


        }
    };
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());
    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    return (
        <Form
            name="basic"
            labelCol={{span: 8}}
            wrapperCol={{span: 16}}
            style={{maxWidth: 600}}
            initialValues={{
                name: data?.name || '',
                year: data?.year ? dayjs().year(data?.year).month(1).day(1) : form_date,
                code: data?.code || '',

            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            form={form}
        >
            <Form.Item<FieldType>
                label="نام"
                name="name"
                rules={[{required: true, message: 'Please input your username!'}]}
            >
                <Input/>
            </Form.Item>
            <Form.Item
                label="کد"
                name="code"
                rules={[{required: true, message: 'Please input your username!'}]}
            >
                <Input/>
            </Form.Item>
            <Form.Item
                label="سال"
                name="year"
                rules={[{required: true, message: 'Please input your username!'}]}
            >
                <DatePickerJalali
                    picker="year"
                    // defaultValue={"1403"}
                    // defaultValue={form_date}
                    onChange={e => {
                        set_form_date(e)
                    }
                    }
                />
            </Form.Item>
            <Form.Item name="Location" label={label} rules={[
                {
                    required: data?.type !== 0
                },
            ]} hidden={data?.type == 0}>
                <Select
                    showSearch
                    filterOption={filterOption}
                    placeholder={" انتخاب " + label + " مربوطه "}
                    // optionFilterProp="children"
                    // onChange={onChange}
                    // onSearch={onSearch}
                    // filterOption={filterOption}
                    options={

                        location.map((item) => {
                            return {label: item.name, value: item.id}
                        })}
                />

            </Form.Item>
            <Form.Item wrapperCol={{offset: 8, span: 16}}>
                <Button type="primary" htmlType="submit">
                    {
                        editmode ? "ویرایش" : "ایجاد"
                    }
                </Button>
            </Form.Item>

        </Form>
    )
}