"use client";

import {Button, Form, FormProps, Input, Select} from "antd";
import React, {useEffect, useState} from "react";
import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

export  type form5_doc = {
    type: number,
    id: number,
    name: string,
    title: string,
    code?: number,
    year?: number,
    budget_chapter?: number,
    budget_section?: number,
    budget_row?: number,
    budget_sub?: number,
    fin_code?: number
    // data?:
}

export default function Form5_doc({data, onOk, onCancel}: {
    data: form5_doc,
    onOk?: (b: boolean) => void,
    onCancel?: () => void
}) {
    const editmode = data.id !== null
    const [location, setlocation] = useState([]);
    const [form] = Form.useForm()
    const label = (() => {
        switch (data?.type) {
            case 1:
                return "فصل"
            case 2:
                return "ردیف"
            case 3:
                return "واحد زیرردیف"
            default:
                return "فصل"
        }

    })();
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa'); // Set the locale to Persian/Farsi
    dayjs["calendar"]('jalali');
    const [form_date, set_form_date] = useState(dayjs(new Date()))

    type FieldType = {
        Location: number;
        name?: string;
        year?: string;
        code?: number;
        fin_code?: number;

    };
    useEffect(() => {
        if (data?.type !== 0) {
            form.setFieldsValue({Location: data?.budget_chapter})
            let Year = dayjs(form_date).format("YYYY");
            let url = (() => {
                switch (data?.type) {
                    case 1:
                        form.setFieldsValue({Location: data?.budget_chapter})
                        return "/api/budget_chapter?no_pagination=true&year=" + Year
                    case 2:
                        form.setFieldsValue({Location: data.budget_section == null ? "" : data.budget_section})
                        return "/api/budget_section?no_pagination=true&year=" + Year
                    case 3:
                        form.setFieldsValue({Location: data.budget_row == null ? "" : data.budget_row})
                        return "/api/budget_row?no_pagination=true&year=" + Year
                }
            })();
            // console.log(url)
            api().url(url).get().json<any[]>().then(r => {
                // console.log(r)
                setlocation(r)
            })
        }


    }, [form_date]);
    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        console.log('Success:', values);
        //to persian year number
        let yearPicker = dayjs(values.year).format("YYYY");
        // console.log( dayjs(values.year).format("YYYY"))
        // console.log(yearPicker)
        if (editmode) {
            switch (data?.type) {
                case 0:
                    api().url("/api/budget_chapter/" + data.id + "/").put({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        fin_code: values.fin_code
                        // rel_id: values.Location
                    }).json().then(r => {
                        console.log(r)
                        form.resetFields()
                        onOk(true)
                    })
                    break;
                case 1:
                    api().url("/api/budget_section/" + data.id + "/").put({
                        name: values.name,
                        budget_chapter: values.Location,
                        year: yearPicker,
                        code: values.code,
                        fin_code: values.fin_code
                    }).json().then(r => {
                        console.log(r)
                        form.resetFields()
                        onOk(true)
                    })
                    break;
                case 2:
                    api().url("/api/budget_row/" + data.id + "/").put({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        budget_section: values.Location,
                        fin_code: values.fin_code
                    }).json().then(r => {

                        onOk(true)
                        form.resetFields()
                    })
                case 3:
                    api().url("/api/budget_sub_row/" + data.id + "/").put({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        budget_row: values.Location,
                        fin_code: values.fin_code
                    }).json().then(r => {

                        onOk(true)
                        form.resetFields()
                    })
            }
            
        } else {
            switch (data?.type) {
                case 0:
                    api().url("/api/budget_chapter/").post({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        fin_code: values.fin_code
                    }).json().then(r => {
                        onOk(true)
                        console.log(r)
                        form.resetFields()
                    })
                    break;
                case 1:
                    api().url("/api/budget_section/").post({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        budget_chapter: values.Location,
                        fin_code: values.fin_code
                    }).json().then(r => {
                        onOk(true)
                        console.log(r)
                        form.resetFields()
                    })
                    break;
                case 2:
                    api().url("/api/budget_row/").post({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        budget_section: values.Location,
                        fin_code: values.fin_code
                    }).json().then(r => {
                        onOk(true)
                        form.resetFields()
                    })
                case 3:
                    api().url("/api/budget_sub_row/").post({
                        name: values.name,
                        year: yearPicker,
                        code: values.code,
                        budget_row: values.Location,
                        fin_code: values.fin_code
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
                fin_code: data?.fin_code || ''
            }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            form={form}

        >
            <Form.Item
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
                label="کد امور مالی"
                name="fin_code"
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