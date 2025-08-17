"use client";
import { api, fetcher } from "@/app/fetcher";
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
import SignatureList from "@/app/components/SignatureList";

export function numberWithCommas(x) {

    return x !== null ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0
}

function convertToPersianNumber(number) {

    return number.toLocaleString('fa-IR');
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

export async function asyncFetchLogisticsData(id) {
    let nextURL = `/api/logistics/?Fdoc_key=${id}`;
    let url = false
    let newdata = []
    while (nextURL) {
        const res = await api().url(nextURL, url).get().json();

        if (res.next !== null) {
            url = true
        }
        nextURL = res.next;
        newdata.push(...res.results.map((item) => ({ "key": item.id, ...item })));
    }
    console.log(newdata)
    return newdata
}

function Fin_last_print(props, ref) {
    const [Log_list, set_Log_list] = useState([], (x) => convertToPersianNumber(x));
    const [fin, set_fin] = useState({});
    const [username, set_username] = useState({});
    const refreshLayout = useRefreshLayout();
    const { Text } = Typography;
    let id = props.record ? props.record.id : 41;
    const Payment_type = props.record ? props.record.Payment_type : false
    const user = props.record ? props.record.user : ''

    const Date_Rec = fin.date_doc && !isNaN(new Date(fin.date_doc))
        ? new Intl.DateTimeFormat('fa-IR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            numberingSystem: 'latn' 
        }).format(new Date(fin.date_doc))
        : '';

    let Price = 0;
    Log_list.forEach(({ price, }) => {
        Price += price;
    });
    let Vat = 0
    Log_list.forEach(({ vat, }) => {
        Vat += vat
    })
    dayjs.calendar('jalali');
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa');

    useEffect(() => {
        fetcher("/get_user_info").then((data) => {
            set_username(data);
            Cookies.set("username", data.name);
            Cookies.set("admin", data.admin);
            refreshLayout();
        });
    }, [refreshLayout]);

    let bank_log_list = Log_list.reduce((acc, item) => {
        const existingItem = acc.find(i => i.account_number === item.account_number && i.account_name === item.account_name);
        if (existingItem) {
            existingItem.price += item.price;
            existingItem.vat += item.vat;
            const existingBudgetRow = existingItem.budget_rows.find(br => br.id === item.budget_row.id);
            if (existingBudgetRow) {
                existingBudgetRow.price += item.price;
            } else {
                existingItem.budget_rows.push({ ...item.budget_row, price: item.price });
            }
        } else {
            acc.push({
                ...item,
                budget_rows: [{ ...item.budget_row, price: item.price }]
            });
        }
        return acc;
    }, []);



    let new_log_list = Log_list.reduce((acc, item) => {
        const existingItem = acc.find(i =>
            i.program.fin_code === item.program.fin_code &&
            i.budget_row.fin_code === item.budget_row.fin_code
        );
        if (existingItem) {
            existingItem.name = existingItem.name + " - " + item.name;
            existingItem.price += item.price;
            existingItem.vat += item.vat;
            if (existingItem.Location && item.Location) {
                if (existingItem.Location.organization_name !== item.Location.organization_name &&
                    !existingItem.Location.name.includes(item.Location.name)) {
                    existingItem.Location.organization_name = `${existingItem.Location.organization_name || ""}${existingItem.Location.organization_name ? " - " : ""}${item.Location.organization_name || ""}`.trim();
                }
            } else if (item.Location) {
                existingItem.Location = { ...item.Location };
            }
        } else {
            acc.push({ ...item });
        }
        return acc;
    }, []);

    let Price_ir = numberWithCommas(convertToPersianNumber(Price))
    let Vat_ir = numberWithCommas(convertToPersianNumber(Vat))
    useEffect(() => {


        asyncFetchLogisticsData(id).then(r => {
            set_Log_list(r)
            // console.log(r);
        });

        if (props.record) {
            set_fin(props.record);
        } else {
            api().url(`/api/financial/${id}`).get().json().then((res) => {
                set_fin(res)
            })
        }
    }
        ,
        []
    )
    //props.record.updated
    const columns1 = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: "5px",
            align: "center",
            render: (text, record, index) => index + 1
        },
        {
            title: 'نام کالا/خدمات',
            dataIndex: 'name',
            key: 'name',
            align: 'center',
            render: (text) => {
                if (typeof text === 'string') {
                    const items = text.split(' - ');
                    const uniqueItems = [...new Set(items)].map(item => toPersianNumbers(item));
                    return uniqueItems.join(' - ');
                }
                return toPersianNumbers(text);
            }
        },
        {
            title: 'کد و عنوان ردیف هزینه', dataIndex: 'budget_row', key: 'budget_row', align: "center", 
            render: (data) => data.fin_code + ":" + data.name
        },
        , {
            title: 'کد و عنوان برنامه', dataIndex: 'program', key: 'program', align: "center", 
            render: (data) => data.fin_code + ":" + data.name
        },
        {
            title: 'محل هزینه',
            dataIndex: 'Location',
            key: 'Location',
            align: 'center',
            render: (data) => {
                const name = data?.organization_name;
                if (typeof name === 'string') {
                    const items = name.split(' - ');
                    const uniqueItems = [...new Set(items)];
                    return uniqueItems.join(' - ');
                }
                return name;
            }
        },
        {
            title: 'نوع',
            dataIndex: 'cost_type',
            key: 'cost_type',
            render: (cost_type) => {
                switch (cost_type) {
                    case 0:
                        return "عمومی";
                    case 1:
                        return "اختصاصی";
                    case 2:
                        return "متفرقه و ابلاغی";
                    case 3:
                        return "تعمیر و تجهیز";
                    case 4:
                        return "تامین فضا";
                    default:
                        return "نامشخص";
                }
            },
            align: "center",
        },

        {
            title: 'مبلغ',
            dataIndex: 'price',
            key: 'price', width: 150,
            render: (price) => <span className={"text-sm font-extrabold"}>{convertToPersianNumber(price)}</span>,
            align: "center",
        },

        {
            title: 'ارزش افزوده',
            dataIndex: 'vat',
            key: 'vat',
            align: 'center',
            render: (value) => toPersianNumbers(value)
        }
    ];
    const columns2 = [
        {
            title: '#',
            dataIndex: 'index',
            key: 'index',
            width: "5px",
            align: "center",
            render: (text, record, index) => index + 1
        },
        {
            title: 'کد و عنوان ردیف هزینه', dataIndex: 'budget_row', key: 'budget_row', align: "center", width: 200,
            render: (data) => data.fin_code + ":" + data.name
        },
        {
            title: 'کد و عنوان برنامه', dataIndex: 'program', key: 'program', align: "center",
            render: (data) => data.fin_code + ":" + data.name
        },
        {
            title: 'محل هزینه',
            dataIndex: 'Location',
            key: 'Location',
            align: 'center',
            render: (data) => {
                const name = data?.organization_name;
                if (typeof name === 'string') {
                    const items = name.split(' - ');
                    const uniqueItems = [...new Set(items)];
                    return uniqueItems.join(' - ');
                }
                return name;
            }
        },
        {
            title: 'نوع',
            dataIndex: 'cost_type',
            key: 'cost_type',
            render: (cost_type) => {
                switch (cost_type) {
                    case 0:
                        return "عمومی";
                    case 1:
                        return "اختصاصی";
                    case 2:
                        return "متفرقه و ابلاغی";
                    case 3:
                        return "تعمیر و تجهیز";
                    case 4:
                        return "تامین فضا";
                    default:
                        return "نامشخص";
                }
            },
            align: "center",
        },

        {
            title: 'مبلغ',
            dataIndex: 'price',
            key: 'price', width: 150,
            render: (price) => <span className={"text-sm font-extrabold"}>{convertToPersianNumber(price)}</span>,
            align: "center",
        },

    ];
    const columns_bank = [


        {
            title: 'نام و نام خانوادگی / شرکت', dataIndex: 'account_name', key: 'account_name', align: "center"
        },

        {
            title: 'شماره حساب', dataIndex: 'account_number', key: 'account_number', align: "center",
            render: (account_number) => <span className={"text-sm font-extrabold"}>IR{account_number}</span>,
        },
        {
            title: 'نام بانک', dataIndex: 'bank_name', key: 'bank_name', align: "center"
        },

        {
            title: 'مبلغ',
            dataIndex: 'price',
            key: 'price', width: 150,
            render: (price) => <span className={"text-sm font-extrabold"}>{convertToPersianNumber(price)}</span>,
            align: "center",
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
                <div className="page-content pl-5">
                    <header className="pb-2">
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
                                <p className={"text-center  yekan text-xl"}> {!fin.Payment_type && "(کسر از تنخواه)"} </p>
                            </Col>
                            <Col span={6} className={"text-right"}>
                                <div className={"float-left"}>
                                    <h1> شماره سند: {(parseInt(fin.code)).toLocaleString('fa-IR')} </h1>
                                    <h1>تاریخ: {toPersianNumbers(Date_Rec)}</h1>
                                    <h1>
                                        پیوست: دارد
                                    </h1></div>
                            </Col>
                        </Row>
                    </header>

                    <article className={"pb-4 pt-4"}>
                        <Table className={"text-s "} columns={columns1} dataSource={new_log_list} bordered
                            pagination={false}
                            rowClassName={'row'}

                            summary={(pageData) => {


                                return (<>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={1} colSpan={5} align={"center"}
                                            className={"font-bold"}>
                                            {Payment_type ?
                                                <Text type="">جمع کل به حروف : {Num2persian(Price)} ریال </Text> :
                                                <p className={""}>کسر از تنخواه(شارژ تنخواه) {user} به
                                                    مبلغ {Num2persian(Price)} ریال </p>
                                            }

                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={2} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{Price_ir}  </Text>
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{Vat_ir}  </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>

                                </>);
                            }} />
                    </article>
                    {Payment_type &&
                        <article className={"pb-4 "}>
                            <Table className={"text-s "} columns={columns_bank} dataSource={bank_log_list} bordered
                                pagination={false}
                                rowClassName={'row'}
                                summary={(pageData) => {
                                    return (<>
                                        <Table.Summary.Row>

                                            <Table.Summary.Cell index={1} colSpan={3} align={"center"}
                                                className={"font-bold"}>
                                                <Text type="">جمع کل به حروف : {Num2persian(Price)} ریال </Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                                <Text className={"text-sm font-extrabold"}>{Price_ir}  </Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>);
                                }} />
                        </article>}
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

            <div className="">
                <div className="page-content pl-5">
                    <header>
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
                                <p className={"text-center  yekan text-xl"}> {!fin.Payment_type && "(کسر از تنخواه)"} </p>
                            </Col>
                            <Col span={6} className={"text-right"}>
                                <div className={"float-left"}>
                                    <h1> شماره سند: {(parseInt(fin.code)).toLocaleString('fa-IR')} </h1>
                                    <h1>تاریخ: {toPersianNumbers(Date_Rec)}</h1>
                                    <h1>
                                        پیوست: دارد
                                    </h1></div>
                            </Col>

                        </Row>


                    </header>
                    <article className={"pb-4 text-right pt-4"}>
                        <p className={"font-bold"}>مدیر محترم امور مالی</p>
                        <p>به استناد مواد ۱۶ و ۱۷ آئین نامه مالی و معاملاتی دانشگاه مبلغ {Price_ir} به ریال</p>
                        <p> مبلغ به حروف : {Num2persian(Price)} ریال بابت {Num2persian(bank_log_list.length)} فقره سند
                            هزینه از محل اعتبارات ردیف ۱۲۲۹۰۰ بودجه
                            سال {fin.date_doc && !isNaN(new Date(fin.date_doc)) ? new Intl.DateTimeFormat('fa-IR', {
                                year: 'numeric'
                            }).format(new Date(fin.date_doc)) : ''} کل کشور نسبت به پرداخت اقدام نمائید. </p>


                    </article>
                    <Row className={"p-0"}>
                        <Col span={16}></Col>
                        <Col span={8} className={" text-left"}>
                            <h1>
                                ارقام به ریال می باشد
                            </h1>
                        </Col>
                    </Row>
                    <article className={"pb-4 "}>
                        <Table className={"text-s "} columns={columns2} dataSource={new_log_list} bordered
                            pagination={false}
                            rowClassName={'row'}

                            summary={(pageData) => {
                                return (<>
                                    <Table.Summary.Row>
                                        <Table.Summary.Cell index={1} colSpan={4} align={"center"}
                                            className={"font-bold"}>
                                            {Payment_type ?
                                                <Text type="">جمع کل به حروف : {Num2persian(Price)} ریال </Text> :
                                                <p className={""}>کسر از تنخواه(شارژ تنخواه) {user} به
                                                    مبلغ {Num2persian(Price)} ریال </p>
                                            }
                                        </Table.Summary.Cell>
                                        <Table.Summary.Cell index={1} colSpan={2} align={"center"}>
                                            <Text className={"text-sm font-extrabold"}>{Price_ir}  </Text>
                                        </Table.Summary.Cell>
                                    </Table.Summary.Row>
                                </>);
                            }} />
                    </article>
                    {Payment_type &&
                        <article className={"pb-4 "}>
                            <Table className={"text-s "} columns={columns_bank} dataSource={bank_log_list} bordered
                                pagination={false}
                                rowClassName={'row'}
                                summary={(pageData) => {
                                    return (<>
                                        <Table.Summary.Row>
                                            <Table.Summary.Cell index={1} colSpan={3} align={"center"}
                                                className={"font-bold"}>
                                                <Text type="">جمع کل به حروف : {Num2persian(Price)} ریال </Text>
                                            </Table.Summary.Cell>
                                            <Table.Summary.Cell index={1} colSpan={1} align={"center"}>
                                                <Text className={"text-sm font-extrabold"}>{Price_ir}  </Text>
                                            </Table.Summary.Cell>
                                        </Table.Summary.Row>
                                    </>);
                                }} />
                        </article>}
                    <footer className="nazanin" style={{ width: "100%" }}>
                        <table style={{ width: "100%" }}>
                            <tbody style={{ width: "100%" }}>
                                <tr style={{ width: "100%" }}>
                                    <td style={{ width: "50%" }}></td>
                                    <td className={"py-5 text-center text-2xl"}>
                                        <p>رئیس دانشگاه</p>
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

const ForwardedFinPrint = React.forwardRef(Fin_last_print);
ForwardedFinPrint.displayName = 'Fin_last_print';

export default ForwardedFinPrint;