"use client";
import {Button, Col, Form, Row, Select} from "antd";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import React, {useEffect, useState} from "react";
import {api} from "@/app/fetcher";
import {numberWithCommas} from "@/app/Logistics/Print/page";
import {User} from "@/app/Logistics/Tankhah/sabt/page";
import Cookies from "js-cookie";

export default function Report() {
    const [form] = Form.useForm();
    const [report, set_report] = useState<any>()
    const [users, set_users] = useState<User[] | undefined>(undefined);
    const [show_user_selector, set_Show_user_selector] = useState(Cookies.get("group") == "financial" || Cookies.get("admin") == "true");

    useEffect(() => {

        show_user_selector && api().url(`/api/getAllLogisticUser/`).get().json<User[]>().then((res) => {
            console.log(res)
            set_users(res)
        })
    }, [])
    useJalaliLocaleListener();
    let Payment_t = null
    let Payment_t_sum = null
    let Payment_f = null
    let Payment_f_sum = null
    const getsum = (value, payment) => value.aggregated_financials.filter(x => x.Payment_type == payment)[0].fin_state_groups.reduce((a, b) => a + b.total_price, 0);

    const getdeatail = (value, payment) => {

        return value.aggregated_financials.filter(x => x.Payment_type == payment)[0].fin_state_groups.sort((a, b) => b.fin_state - a.fin_state).map(x => {
            let d = ""
            console.log(x)
            if (x.fin_state == 0) {
                d = "اقدام شده"
            } else if (x.fin_state == 1) {
                d = "در حال بررسی"
            } else if (x.fin_state == 2) {
                d = "تایید شده"
            }
            return (<tr key={d}>
                <td>{d}</td>
                <td>{
                    numberWithCommas(x.total_price)
                }</td>
            </tr>)
        })


    }
    dayjs.extend(jalaliPlugin);
    dayjs["calendar"]('jalali');
    const [Start_date, set_Start_date] = useState(dayjs(new Date()).locale('jalali'));
    const [End_date, set_End_date] = useState(dayjs(new Date()).locale('jalali'));
    const onFinish = (values) => {

        api().url(`/api/pettycashreport/`).post({
            start_date: Start_date,
            end_date: End_date,
            user: show_user_selector ? values.forwhom.value : null
        }).json().then(value => {
                console.log(value);
                set_report(value);
                // Payment_t=value.aggregated_financials.filter( x => x.Payment_type==true )[0].fin_state_groups;
                // Payment_t_sum=Payment_t.reduce((a, b) => a + b.total_price, 0);
                //
                // Payment_f =value.aggregated_financials.filter( x => x.Payment_type==false )[0].fin_state_groups;
                // Payment_f_sum=Payment_f.reduce((a, b) => a + b.total_price, 0);
                // console.log(Payment_f)
            }
        )
    }
    return (
        <>
            <Form
                form={form}
                autoComplete="off"
                onFinish={onFinish}
                initialValues={{
                    // date_doc: form_date,
                }}
            >
                <Row gutter={50}>
                    <Col span={6}>

                        <Form.Item name="start_date" label="تاریخ شروع" rules={
                            [{
                                required: true,
                            }]
                        }>
                            <DatePickerJalali
                                // value={form_date}
                                // defaultValue={form_date}
                                onChange={e => set_Start_date(e)}


                            />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="end_date" label="تاریخ پایان" rules={
                            [{
                                required: true,
                            }]
                        }>
                            <DatePickerJalali
                                // value={form_date}
                                // defaultValue={form_date}
                                onChange={e => set_End_date(e)}
                            />
                        </Form.Item>

                    </Col>
                    {show_user_selector &&
                        <Col span={6}>
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
                    </Col>
                    }

                    <Col span={6}>
                        <Button type="primary" htmlType="submit">
                            {
                                "ارسال درخواست"
                            }
                        </Button>
                    </Col>

                </Row>

            </Form>

            <table className={"  w-full mytable "}>
                <thead>
                <tr className={" border-2 mytable "}>


                    <td className={"  border-collapse border-l-2 border-black"}>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>
                            <tr>
                                <td> عنوان حساب</td>
                                <td>مبلغ</td>

                            </tr>
                            </tbody>

                        </table>
                    </td>
                    <td className={"    !border-none border-collapse "}>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>
                            <tr>
                                <td> عنوان حساب</td>
                                <td>مبلغ</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>


                </tr>
                </thead>
                <tbody>
                <tr className={"border-2 border-black"}>
                    <td className={"  border-collapse border-l-2 border-black"}>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>
                            <tr className={" w-full table   !border-none border-collapse "}>
                                <td> تنخواه دریافتی</td>
                                <td>  {report && report.petty_cash ? numberWithCommas(report.petty_cash) : 0}</td>

                            </tr>
                            <tr className={" w-full table   !border-none border-collapse "}>
                                <td> اسناد پرداخت مستقیم</td>
                                <td> {report ? numberWithCommas(getsum(report, true)) : 0}</td>
                            </tr>
                            </tbody>
                        </table>

                    </td>
                    <td>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>

                            <tr className={" w-full table !border-none border-collapse "}>
                                <td> موجودی بانک</td>
                                <td
                                    style={{
                                        direction: "ltr"
                                    }}
                                > {report ? numberWithCommas(report.petty_cash - getsum(report, false)) : 0}</td>
                            </tr>
                            <tr className={" w-full table  !border-none border-collapse "}>
                                {report ? (getdeatail(report, false)) : null}
                            </tr>

                            <tr className={" w-full table  !border-none border-collapse "}>
                                <td> اسناد پرداخت مستقیم</td>
                                <td> {report ? numberWithCommas(getsum(report, true)) : 0}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                <tr>
                    <td className={"    border-collapse border-black border-l-2 "}>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>
                            <tr className={" w-full table   border-collapse  !border-none border-collapse "}>
                                <td>جمع</td>
                                <td>{report ? numberWithCommas(report.petty_cash + getsum(report, true)) : 0}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                    <td>
                        <table className={"  w-full   !border-none border-collapse "}>
                            <tbody>
                            <tr className={" w-full table   !border-none border-collapse "}>
                                <td>جمع</td>
                                <td> {report ? numberWithCommas(getsum(report, true) + (report.petty_cash - getsum(report, false)) + (getsum(report, false))) : 0}</td>
                            </tr>
                            </tbody>
                        </table>
                    </td>
                </tr>
                </tbody>
            </table>
        </>
    )

}