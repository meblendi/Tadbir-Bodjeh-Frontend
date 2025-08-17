"use client";
import { fetcher } from "@/app/fetcher";
import arm from "@/images/Arm.jpg";
import { jalaliPlugin } from "@realmodule/antd-jalali";
import { Col, ConfigProvider, Row, Table, Typography } from "antd";
import fa_IR from "antd/lib/locale/fa_IR";
import dayjs from "dayjs";
import Image from "next/image";
import Num2persian from 'num2persian';
import Cookies from "js-cookie";
import { useRefreshLayout } from "@/app/layout";
import React, { useEffect, useState } from "react";
import "@/styles/table.css";
import store from 'store2';
import SignatureList from "@/app/components/SignatureList";

export function numberWithCommas(x) {
    return (x !== null && x !== undefined) ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}

function toPersianNumbers(str) {
    if (str == null) {
        // Handle null or undefined values
        return "";
    }

    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return str.toString().replace(/[0-9]/g, function (w) {
        return persianNumbers[+w];
    });
}


// ----------------------------------------

function Contract_func(props, ref) {
    const Date_Rec = dayjs().format('YYYY/MM/DD')
    // Retrieve the table props from localStorage
    const tableProps = store.get('tableProps');

    // State to store the sum values
    const [sums, setSums] = useState([]);

    // Filter out unwanted columns and format specific columns
    const filteredColumns = tableProps.columns
        .filter(
            (column) =>
                column.dataIndex !== "operation")
        .map((column) => {
            // Format toPersianNumbers and numberWithCommas
            if (column.dataIndex === "debt" || column.dataIndex === "final_payable_amount"
                || column.dataIndex === "tax_amount" || column.dataIndex === "requested_performance_amount"
            ) {
                return {
                    ...column,
                    render: (text) => toPersianNumbers(numberWithCommas(Math.floor(text))),
                };
            }
            // Format with toPersianNumbers
            if (column.dataIndex === "contractor_id" || column.dataIndex === "contract_num"
                || column.dataIndex === "doc_date" || column.dataIndex === "account_number"
                || column.dataIndex === "tax_percentage"
            ) {
                return {
                    ...column,
                    render: (text) => toPersianNumbers(text),
                };
            }
            // Return other columns as-is
            return column;
        });

    // Calculate the sums for each column and update the state
    useEffect(() => {
        const calculatedSums = filteredColumns
            .filter(column => column.dataIndex === "debt" || column.dataIndex === "final_payable_amount"
                || column.dataIndex === "tax_amount" || column.dataIndex === "requested_performance_amount")
            .map(column => {
                return tableProps.dataSource.reduce((acc, row) => {
                    return acc + (parseFloat(row[column.dataIndex]) || 0);
                }, 0);
            });
        setSums(calculatedSums); // Update the state with the calculated sums
    }, [tableProps.dataSource, filteredColumns]); // Recalculate sums when dataSource or columns change

    const [username, set_username] = useState({});
    const refreshLayout = useRefreshLayout();
    const Contractor_level = props.record ? props.record.Contractor_level : "";
    const Contractor_level_name =
        Contractor_level === "d1"
            ? "کارکردهای متفرقه"
            : Contractor_level === "d2"
                ? "کارکردهای متفرقه"
                : "نامشخص";
    const { Text } = Typography;

    dayjs.calendar('jalali');
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa');
    const record = props.record || {};
    console.log(record)

    useEffect(() => {
        fetcher("/get_user_info").then((data) => {
            set_username(data);
            Cookies.set("username", data.name);
            Cookies.set("admin", data.admin);
            refreshLayout();
        });
    }, [refreshLayout]);

    const columns1 = [
        {
            title: 'ردیف هزینه',
            dataIndex: 'budget_row',
            render: (data) => {
                console.log("Budget Row Data:", data); // Debugging
                if (!data) return 'اطلاعات موجود نیست'; // Handle undefined or null
                if (typeof data === 'string') {
                    const [name, finCode] = data.split(':');
                    return `${toPersianNumbers(finCode?.trim() || '')} : ${name?.trim() || ''}`;
                }
                if (typeof data === 'object') {
                    const finCode = data.fin_code || '';
                    const name = data.name || '';
                    return `${toPersianNumbers(finCode)} : ${name}`;
                }
                return '';
            },
        },

        {
            title: 'عنوان برنامه',
            dataIndex: 'program',
            render: (data) => {
                console.log("Budget Row Data:", data); // Debugging
                if (!data) return 'اطلاعات موجود نیست'; // Handle undefined or null
                if (typeof data === 'string') {
                    const [name, finCode] = data.split(':');
                    return `${toPersianNumbers(finCode?.trim() || '')} : ${name?.trim() || ''}`;
                }
                if (typeof data === 'object') {
                    const finCode = data.fin_code || '';
                    const name = data.name || '';
                    return `${toPersianNumbers(finCode)} : ${name}`;
                }
                return '';
            },
        },
        {
            title: 'محل هزینه',
            dataIndex: 'organization',
        },
        {
            title: 'محل اعتبار',
            dataIndex: 'cost_type',
        },
        {
            title: 'جمع مبلغ ناخالص',
            dataIndex: 'preAmount_sum',
            render: (value) => {
                return (
                    <p className={"text-sm font-extrabold"}>
                        {toPersianNumbers(numberWithCommas(Math.floor(sums[0])))}
                    </p>
                );
            },
        },
    ];


    return <ConfigProvider locale={fa_IR} direction="rtl" theme={{
        token: {
            fontFamily: "Yekan",
            Table: {
                cellFontSize: 12,
                padding: "2px",
                borderColor: "black"
            }
        }
    }}>

        <div ref={ref} className={" yekan block"} dir="rtl">
            <div className="break-after-page">
                <div className="page-content justify-center pl-5">
                    <header className="pb-7">
                        <Row gutter={50}>
                            <Col span={6}>
                                <Image
                                    src={arm}
                                    height={100}
                                    alt="Picture of the author"
                                    className={""}
                                />
                            </Col>
                            <Col span={12}>
                                <p className={"text-center font-bold yekan text-2xl"}>دانشگاه هنر اسلامی تبریز </p>
                                <p className={"text-center font-bold yekan text-2xl"}> حواله پرداخت </p>
                                <p className={"text-center font-bold yekan text-2xl"}> {Contractor_level_name} </p>
                            </Col>
                            <Col span={6} className={"text-right"}>
                                <div className={"float-left"}>
                                    <h1> شماره کارکرد:  {(parseInt(props.record?.id)).toLocaleString('fa-IR')} - {toPersianNumbers(record.code) || ''}</h1>
                                    <h1>تاریخ: {toPersianNumbers(Date_Rec)}</h1>
                                    {//{toPersianNumbers("1403/12/28")}
                                    }
                                </div>
                            </Col>
                        </Row>
                    </header>

                    <article className={"pb-4"}>
                        <Table className={"text-lg pb-5"} columns={columns1} dataSource={[record]}
                            bordered pagination={false}
                            rowClassName={'row'} />
                        <Table className={"mb-5"} bordered
                            dataSource={tableProps.dataSource}
                            columns={filteredColumns} pagination={false}
                            rowClassName={'row'}
                            summary={(pageData) => {
                                return (<>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell
                                            index={1}
                                            colSpan={Contractor_level === "d1" ? 5 : 8}
                                            align={"center"}
                                            className={"font-bold"}
                                            style={{ paddingLeft: '0px' }}
                                        >
                                            <Text type="" style={{ paddingLeft: '12px', textAlign: 'left', display: 'block', width: '100%' }}>جمع کل : </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[0])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[1])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[2])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[3])))}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </>);
                            }} />
                        <div className=" flex gap-5 mb-5"><p><span className="font-bold text-l">شرح : </span>{record.descr || ''}</p><p><span className="font-bold text-l">طی شماره سند   {toPersianNumbers(record.contract_number) || ''}  به تاریخ  {toPersianNumbers(dayjs().format('YYYY/MM/DD'))}</span></p>
                        </div>
                    </article>
                    <footer className="nazanin" style={{ width: "100%" }}>
                        <table style={{ width: "100%" }}>
                            <tbody style={{ width: "100%" }}>
                                <tr style={{ width: "100%" }}>

                                    <td className={"py-5"}>
                                        <p className={"text-center"}>تنظیم و رسیدگی</p>
                                        <p className={"text-center"}> {username?.name} </p>
                                    </td>
                                    <td className={"no-wrap py-5 "}>
                                        <p className={"text-center"}>صدور حواله</p>
                                        <p className={"text-center no-wrap"}><SignatureList date={Date_Rec} role="financialAssistant" /></p>
                                    </td>
                                    <td className={"py-5"}>
                                        <p className={"text-center"}>مدیر امور مالی</p>
                                        <p className={"text-center"}><SignatureList date={Date_Rec} role="financialManager" /></p>
                                    </td>
                                    <td className={"py-5"}>
                                        <p className={"text-center"}>معاون اداری، عمرانی و مالی</p>
                                        <p className={"text-center"}><SignatureList date={Date_Rec} role="director" /></p>
                                    </td>
                                </tr>


                            </tbody>
                        </table>
                    </footer>
                </div>
            </div>
            <div className="  ">
                <div className="page-content pl-5">
                    <header className="pb-5">
                        <Row gutter={50}>
                            <Col span={6}>
                                <Image
                                    src={arm}
                                    height={100}
                                    alt="Picture of the author"
                                    className={""}
                                />
                            </Col>
                            <Col span={12}>
                                <p className={"text-center font-bold yekan text-2xl"}>دانشگاه هنر اسلامی تبریز </p>
                                <p className={"text-center font-bold yekan text-2xl"}> حواله پرداخت </p>
                                <p className={"text-center font-bold yekan text-2xl"}> {Contractor_level_name} </p>
                            </Col>
                            <Col span={6} className={"text-right"}>
                                <div className={"float-left"}>
                                    <h1> شماره کارکرد:  {(parseInt(props.record?.id)).toLocaleString('fa-IR')} - {toPersianNumbers(record.code) || ''}</h1>
                                    <h1>تاریخ: {toPersianNumbers(Date_Rec)}</h1>
                                </div>
                            </Col>
                        </Row>
                    </header>
                    <article className={"pb-4 text-right pt-1"}>
                        <p className={"font-bold"}>مدیر محترم امور مالی</p>
                        <p>به استناد مواد ۱۶ و ۱۷ آئین نامه مالی و معاملاتی دانشگاه
                            مبلغ {toPersianNumbers(numberWithCommas(Math.floor(sums[3])))} به ریال</p>
                        <p> مبلغ به حروف : {(sums[3] !== undefined ? Num2persian(Math.floor(sums[3])) : "مبلغ نامشخص") + " "}
                            ریال از محل اعتبارات ردیف ۱۲۲۹۰۰ بودجه
                            سال {toPersianNumbers(dayjs(record?.document_date || undefined).format('YYYY'))} کل کشور نسبت به پرداخت اقدام نمائید. </p>
                    </article>
                    <article className={"pb-4"}>
                        <Table className={"text-lg pb-5"} columns={columns1} dataSource={[record]}
                            bordered pagination={false}
                            rowClassName={'row'} />
                        <Table className={"mb-5"} bordered
                            dataSource={tableProps.dataSource}
                            columns={filteredColumns} pagination={false}
                            rowClassName={'row'}
                            summary={(pageData) => {
                                return (<>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell
                                            index={1}
                                            colSpan={Contractor_level === "d1" ? 5 : 8}
                                            align={"center"}
                                            className={"font-bold"}
                                            style={{ paddingLeft: '0px' }}
                                        >
                                            <Text type="" style={{ paddingLeft: '12px', textAlign: 'left', display: 'block', width: '100%' }}>جمع کل : </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[0])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[1])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[2])))}</Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{toPersianNumbers(numberWithCommas(Math.floor(sums[3])))}</Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </>);
                            }} />
                        <div className=" flex gap-5 mb-5"><p><span className="font-bold text-l">شرح : </span>{record.descr || ''}</p><p><span className="font-bold text-l">طی شماره سند   {toPersianNumbers(record.contract_number) || ''}  به تاریخ  {toPersianNumbers(dayjs().format('YYYY/MM/DD'))}</span></p>
                        </div>
                    </article>
                    <footer className="nazanin" style={{ width: "100%" }}>
                        <table style={{ width: "100%" }}>
                            <tbody style={{ width: "100%" }}>
                                <tr style={{ width: "100%" }}>
                                    <td style={{ width: "50%" }}></td>
                                    <td className={"pt-1 text-center text-xl"}>
                                        <p className={""}>رئیس دانشگاه</p>
                                        <SignatureList date={Date_Rec} role="president" />
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </footer>
                </div>
            </div>

        </div>
    </ConfigProvider>
}

const ForwardedFinPrint = React.forwardRef(Contract_func);
ForwardedFinPrint.displayName = 'Contract_func';

export default ForwardedFinPrint;