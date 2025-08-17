"use client";

import {Button, Form, FormProps, Input, InputNumber} from "antd";
import React, {useEffect, useState} from "react";
import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import {ProgramData} from "@/app/budget/program/page";

export default function Programform({data, onOk, onCancel}: {
    data: ProgramData,
    onOk?: (b: boolean) => void,
    onCancel?: () => void
}) {
    const editmode = data.id !== null
    console.log(data.id)
    const [form] = Form.useForm()

    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa'); // Set the locale to Persian/Farsi
    dayjs["calendar"]('jalali');
    const [form_date, set_form_date] = useState(dayjs(new Date()))

    const [generalCost, setGeneralCost] = useState(data?.general_cost || 0);
    const [specificCost, setSpecificCost] = useState(data?.specific_cost || 0);
    const [otherCost, setOtherCost] = useState(data?.other_cost || 0);
    const [totalCost, setTotalCost] = useState(data?.total_cost || 0);

    type FieldType = {
        Location: number;
        name?: string;
        year?: string;
        code?: number;
        fin_code?: number;
        general_cost?: number;
        specific_cost?: number;
        other_cost?: number;
    };

    useEffect(() => {
        setTotalCost(generalCost + specificCost + otherCost);
        console.log(generalCost)
        console.log(specificCost)
        console.log(otherCost)
        console.log(generalCost + specificCost + otherCost)
        console.log(totalCost)
        form.setFieldsValue({total_cost: totalCost})
    }, [generalCost, specificCost, otherCost]);


    const onFinish: FormProps<FieldType>['onFinish'] = (values) => {
        console.log('Success:', values);
        //to persian year number
        let yearPicker = dayjs(values.year).format("YYYY");
        if (editmode) {
            api().url("/api/program/" + data.id + "/").put({
                name: values.name,
                year: yearPicker,
                code: values.code,
                fin_code: values.fin_code,
                general_cost: values.general_cost,
                specific_cost: values.specific_cost,
                other_cost: values.other_cost,

            }).json().then(r => {
                console.log(r)
                form.resetFields()
                onOk(true)
            })
        } else {
            api().url("/api/program/").post({
                name: values.name,
                year: yearPicker,
                code: values.code,
                fin_code: values.fin_code,
                general_cost: values.general_cost,
                specific_cost: values.specific_cost,
                other_cost: values.other_cost,
            }).json().then(r => {
                onOk(true)
                console.log(r)
                form.resetFields()
            })
        }
    };

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const onFinishFailed: FormProps<FieldType>['onFinishFailed'] = (errorInfo) => {
        console.log('Failed:', errorInfo);
    };
    console.log(data)
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
                fin_code: data?.fin_code || '',
                general_cost: data?.general_cost || 0,
                specific_cost: data?.specific_cost || 0,
                other_cost: data?.other_cost || 0,
                total_cost: data?.total_cost || 0
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
                    }}
                />
            </Form.Item>
            <Form.Item
                label="هزینه عمومی"
                name="general_cost"
                rules={[{required: true, message: 'لطفا هزینه عمومی را وارد کنید'}]}
            >
                <InputNumber style={{width: '100%'}} onChange={value => setGeneralCost(Number(value))}/>
            </Form.Item>
            <Form.Item
                label="هزینه اختصاصی"
                name="specific_cost"
                rules={[{required: true, message: 'لطفا هزینه اختصاصی را وارد کنید'}]}
            >
                <InputNumber style={{width: '100%'}} onChange={value => setSpecificCost(Number(value))}/>
            </Form.Item>
            <Form.Item
                label="سایر هزینه ها"
                name="other_cost"
                rules={[{required: true, message: 'لطفا سایر هزینه ها را وارد کنید'}]}
            >
                <InputNumber style={{width: '100%'}} onChange={value => setOtherCost(Number(value))}/>
            </Form.Item>
            <Form.Item
                label="جمع کل هزینه ها"
                name="total_cost"
            >
                <InputNumber style={{width: '100%'}} value={totalCost} disabled/>
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