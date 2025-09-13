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
    return x !== undefined && x !== null ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "0";
}


function convertToPersianNumber(number) {
    return number.toLocaleString('fa-IR');
}

function toPersianNumbers(str) {
    if (str == null) {
        // Handle null or undefined values
        return '';
    }

    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return str.toString().replace(/[0-9]/g, function (w) {
        return persianNumbers[+w];
    });
}


// ----------------------------------------


function Contract_print(props, ref) {

    const TreasuryDeductionTitle = props.record
        ? `${toPersianNumbers(

            (
                props.record.treasury_deduction_percent
            )
        )
        }  درصد کسر خزانه`
        : 'درصد کسر خزانه';
    const OverheadPercentageTitle = props.record
        ? `${toPersianNumbers(

            (
                props.record.overhead_percentage
            )
        )
        }  درصد بالاسری`
        : 'درصد بالاسری';
    const TaxAmountTitle = props.record
        ? `${toPersianNumbers(

            (
                props.record.tax_percentage
            )
        )
        }  درصد مالیات`
        : 'درصد مالیات';
    const VatAmountTitle = props.record
        ? `${toPersianNumbers(

            (
                props.record.vat_percentage
            )
        )
        }  درصد ارزش افزوره`
        : 'درصد ارزش افزوده';
    const PerformanceWithholdingTitle = props.record
        ? `${toPersianNumbers(

            (
                props.record.performanceـwithholding_percentage
            )
        )
        }  درصد حسن انجام کار`
        : 'درصد حسن انجام کار';

    const [username, set_username] = useState({});
    const refreshLayout = useRefreshLayout();
    const Date_Rec = props.record ? props.record.doc_date : ''
    const Contractor_level = props.record ? props.record.Contractor_level : ''
    const Contractor_level_name =
        Contractor_level === "a1" ? 'شرکتهای تامین نیرو' :
            Contractor_level === "a2" ? 'کارکردهای ماهانه' :
                Contractor_level === "a3" ? 'انتظامات شب' :
                    Contractor_level === "a4" ? 'سایر قراردادها' :
                        Contractor_level === "b" ? 'طرح پژوهشی خارجی' :
                            Contractor_level === "c" ? 'صورت وضعیت عمرانی' :
                                "نامشخص";
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
            title: 'مبلغ کارکرد',
            dataIndex: 'total_work_amount',
            render: (value) => {
                if (value === undefined || value === null) {
                    return ''; // or any default value you prefer
                }
                return <strong>{toPersianNumbers(numberWithCommas(value))}</strong>;
            },
            hidden: !["a1", "a2", "a3", "a4"].includes(Contractor_level),
        }



    ]
    const columns2 = [

        {
            title: 'اصل کارکرد',
            dataIndex: 'requested_performance_amount',
            render: (value) => {
                if (value === undefined || value === null) {
                    return ''; // or any default value you prefer
                }
                return toPersianNumbers(numberWithCommas(value));
            },
        },

        {
            title: 'سود',
            dataIndex: 'profit',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: !["a1", "a2"].includes(Contractor_level),
        },

        {
            title: 'شیفت',
            dataIndex: 'shift',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: Contractor_level !== "a3",
        },

        {
            title: 'اضافه کار',
            dataIndex: 'overtime',
            hidden: !["a2", "a3"].includes(Contractor_level),
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },

        },

        {
            title: VatAmountTitle,
            dataIndex: 'vat',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: !["a1", "a2", "a3", "a4"].includes(Contractor_level),
        },

        {
            title: 'کل هزینه کارکرد',
            dataIndex: 'total_work_amount',
            render: (value) => {
                if (value === undefined || value === null) {
                    return ''; // or any default value you prefer
                }
                return toPersianNumbers(numberWithCommas(value));
            },
            hidden: !["a1", "a2", "a3", "a4"].includes(Contractor_level),
        },

        {
            title: 'درصد حسن انجام کار',
            dataIndex: 'performanceـwithholding_percentage',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(validValue);
            },
            hidden: ['a1', 'a2', 'a3', "a4", 'b', 'd', 'c'].includes(Contractor_level),
        },

        {
            title: 'مبلغ حسن انجام کار',
            dataIndex: 'performanceـwithholding',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: ['a1', 'a2', 'a3', "a4", 'b', 'd'].includes(Contractor_level),
        },
        {
            title: 'مبلغ مالیات',
            dataIndex: 'tax_amount',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: ['b', 'a2', 'a3', "a4"].includes(Contractor_level),
        },

        {
            title: 'بیمه',
            dataIndex: 'insurance',
            hidden: Contractor_level !== "c",
            render: (text) => {
                const formatNumber = (value) => toPersianNumbers(numberWithCommas(value));
                return formatNumber(text); // Display Persian-formatted numbers with commas
            },
        },

        {
            title: 'کسر پیش پرداخت',
            dataIndex: 'advance_payment_deductions',
            hidden: Contractor_level !== "c",
            render: (text) => {
                const formatNumber = (value) => toPersianNumbers(numberWithCommas(value));
                return formatNumber(text); // Display Persian-formatted numbers with commas
            },
        },

        {
            title: VatAmountTitle, //درصد ارزش افزوده
            dataIndex: 'vat',
            hidden: Contractor_level !== "c",
            render: (text) => {
                const formatNumber = (value) => toPersianNumbers(numberWithCommas(value));
                return formatNumber(text); // Display Persian-formatted numbers with commas
            },
        },

        {
            title: TreasuryDeductionTitle, // درصد کسر خزانه
            dataIndex: 'treasury_deduction_percent',
            render: (value, record) =>
                toPersianNumbers(
                    numberWithCommas(
                        Math.round((record.requested_performance_amount / 100) * value)
                    )
                ),
            hidden: ['a1', 'a2', 'a3', "a4", 'c', 'a', 'd'].includes(Contractor_level),
        },
        {
            title: OverheadPercentageTitle, // درصد بالاسری
            dataIndex: 'overhead_percentage',
            render: (value, record) => {
                const treasuryDeduction = (record.requested_performance_amount * record.treasury_deduction_percent) / 100;
                const overheadDeduction = Math.round((record.requested_performance_amount - treasuryDeduction) * (value / 100)); // Round to the nearest integer
                return toPersianNumbers(numberWithCommas(overheadDeduction)); // Convert to Persian numbers with commas
            },
            hidden: ['a1', 'a2', 'a3', "a4", 'c', 'a', 'd'].includes(Contractor_level),
        },

        {
            title: PerformanceWithholdingTitle,
            dataIndex: 'performanceـwithholding',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: Contractor_level !== "a4",
        },

        {
            title: TaxAmountTitle, // درصد مالیات
            dataIndex: 'tax_amount',
            render: (text) => {
                const formatNumber = (value) => toPersianNumbers(numberWithCommas(Math.round(value)));
                return formatNumber(text); // Display Persian-formatted numbers with commas
            },
            hidden: !["b", "a2", "a3", "a4"].includes(Contractor_level),
        },

        {
            title: 'جمع کسورات',
            dataIndex: 'Sum_of_deductions',
            render: (value, record) => {
                // Retrieve values from the record                                
                const insuranceamount = record.insurance || 0;
                const advancepaymentdeductions = record.advance_payment_deductions || 0;
                const requestedAmount = record.requested_performance_amount || 0;
                const treasuryDeductionPercent = record.treasury_deduction_percent || 0;
                const overheadPercent = record.overhead_percentage || 0;
                const taxPercentage = record.tax_percentage || 0;
                const performancewithholdingpercentage = record.performanceـwithholding_percentage || 0;

                // Calculate individual deductions
                const treasuryDeduction = Math.round((requestedAmount * treasuryDeductionPercent) / 100);
                const overheadDeduction = Math.round(((requestedAmount - treasuryDeduction) * overheadPercent) / 100);
                const taxAmount = Math.round(((requestedAmount - treasuryDeduction - overheadDeduction) * taxPercentage) / 100);
                const performancewithholding = Math.round((requestedAmount * performancewithholdingpercentage) / 100);

                // Calculate total deductions
                const sumOfDeductions = treasuryDeduction + overheadDeduction + taxAmount + performancewithholding + advancepaymentdeductions + insuranceamount;

                // Format and return the result
                return toPersianNumbers(numberWithCommas(sumOfDeductions)); // Convert to Persian numbers with commas
            },
            hidden: ['a1', 'a2', 'a3', "a4"].includes(Contractor_level),
        },

    ]
    const columns3 = [

        {
            title: 'نام‌ و نام‌خانوادگی/شرکت',
            dataIndex: 'Contractor',
            hidden: ["d1", "d2"].includes(Contractor_level),
        },

        {
            title: 'شماره قرارداد/سند',
            dataIndex: 'contract_number',
            render: (value) => value ? toPersianNumbers(value) : '',
        },
        {
            title: 'تاریخ قرارداد',
            dataIndex: 'document_date',
            render: (data) => toPersianNumbers(dayjs(data).format('YYYY/MM/DD')),
        },
        {
            title: PerformanceWithholdingTitle,
            dataIndex: 'performanceـwithholding',
            render: (value) => {
                const validValue = value || 0; // Default to 0 if value is undefined or null
                return toPersianNumbers(numberWithCommas(validValue));
            },
            hidden: !["a2", "a3"].includes(Contractor_level),
        },

        {
            title: 'مبلغ کارکرد',
            dataIndex: 'total_work_amount',
            render: (value) => value ? toPersianNumbers(numberWithCommas(value)) : '',
            hidden: !["a1", "a2", "a3", "a4"].includes(Contractor_level),
        },
        {
            title: "مبلغ نهایی قابل پرداخت",
            dataIndex: 'final_payable_amount',
            render: (value) => value ? <strong>{toPersianNumbers(numberWithCommas(value))}</strong> : '',
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
                                <p className={"text-center font-bold yekan text-2xl"}> {Contractor_level_name} </p>
                            </Col>
                            <Col span={6} className={"text-right"}>
                                <div className={"float-left"}>
                                    <h1> شماره سند:  {(parseInt(props.record?.id)).toLocaleString('fa-IR')} - {toPersianNumbers(record.code) || ''}</h1>
                                    <h1>تاریخ: {toPersianNumbers(Date_Rec)}</h1>
                                </div>
                            </Col>
                        </Row>
                    </header>

                    <article className={"pb-4"}>
                        <Table className={"text-lg pb-5"} columns={columns1} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <Table className={"text-lg pb-5"} columns={columns2} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <Table className={"text-lg pb-5"} columns={columns3} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <p><span className="font-bold">شرح : </span>{toPersianNumbers(record.descr || '')}</p>
                        <p>
                            <span className="font-bold">شماره حساب : </span>
                            {record.account_number ? (
                                <span dir="ltr">{toPersianNumbers(record.account_number)}</span>
                            ) : 'نامشخص'}
                            <span className="mx-2"></span>
                            <span className="font-bold">--</span>
                            <span className="mx-2"></span>
                            {record.bank_name || 'نامشخص'}
                        </p>
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
                                    <h1> شماره سند:  {(parseInt(props.record?.id)).toLocaleString('fa-IR')} - {toPersianNumbers(record.code) || ''}</h1>
                                    <h1>تاریخ: {toPersianNumbers((Date_Rec))}</h1>
                                </div>
                            </Col>
                        </Row>
                    </header>
                    <article className={"pb-4 text-right pt-1"}>
                        <p className={"font-bold"}>مدیر محترم امور مالی</p>
                        <p>به استناد مواد ۱۶ و ۱۷ آئین نامه مالی و معاملاتی دانشگاه
                            مبلغ {toPersianNumbers(numberWithCommas(record?.final_payable_amount || 0))} به ریال</p>
                        <p> مبلغ به حروف : {Num2persian(record?.final_payable_amount || 0) + " "}
                            از محل اعتبارات ردیف ۱۲۲۹۰۰ بودجه
                            سال {record?.document_date && !isNaN(new Date(record?.document_date)) ? new Intl.DateTimeFormat('fa-IR', {
                                year: 'numeric'
                            }).format(new Date(record?.document_date)) : ''} کل کشور نسبت به پرداخت اقدام نمائید. </p>
                    </article>
                    <article className={"pb-4  "}>
                        <Table className={"text-lg pb-5"} columns={columns1} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <Table className={"text-lg pb-5"} columns={columns2} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <Table className={"text-lg pb-5"} columns={columns3} dataSource={[record]} bordered
                            pagination={false}
                            rowClassName={'row'} />
                        <p><span className="font-bold">شرح : </span>{toPersianNumbers(record.descr || '')}</p>
                        <p>
                            <span className="font-bold">شماره حساب : </span>
                            {record.account_number ? (
                                <span dir="ltr">{toPersianNumbers(record.account_number)}</span>
                            ) : 'نامشخص'}
                            <span className="mx-2"></span>
                            <span className="font-bold">--</span>
                            <span className="mx-2"></span>
                            {record.bank_name || 'نامشخص'}
                        </p>
                    </article>
                    <footer className="nazanin" style={{ width: "100%" }}>
                        <table style={{ width: "100%" }}>
                            <tbody style={{ width: "100%" }}>
                                <tr style={{ width: "100%" }}>
                                    <td style={{ width: "50%" }}></td>
                                    <td className={"pt-1 text-center text-xl"}>
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

const ForwardedFinPrint = React.forwardRef(Contract_print);
ForwardedFinPrint.displayName = 'Contract_print';

export default ForwardedFinPrint;