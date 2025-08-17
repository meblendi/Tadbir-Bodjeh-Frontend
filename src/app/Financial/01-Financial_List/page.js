"use client";
import { api } from "@/app/fetcher";
import Fin_last_print, { numberWithCommas } from "@/app/Financial/01-Financial_List/Print/page";
import Financial_docs from "@/app/Logistics/Financial_docs/page";
import Fin_detail from "@/app/Logistics/Financial_List/detail";
import { DownloadOutlined, PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, message, Modal, Radio, Table, Input, Space } from "antd";
import React, { useEffect, useState } from "react";
import ReactToPrint from "react-to-print";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

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

const App = (props) => {
    const [data, setData] = useState();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedid, setselectedid] = useState(0);
    const [fin_state, set_fin_state] = useState(1);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });
    const [printRefs, setPrintRefs] = useState({});
    const [filteredData, setFilteredData] = useState();
    const [searchText, setSearchText] = useState('');

    const [update, set_update] = useState(0);
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale("fa"); // Set the locale to Persian/Farsi
    dayjs["calendar"]("jalali");
    const [form_date, set_form_date] = useState(dayjs(new Date()));

    // Add search functionality
    const handleSearch = async (value) => {
        setSearchText(value);

        if (value) {
            // Fetch all data (not just current page) when searching
            const allData = await fetchSearchData();
            const filtered = allData.filter(item =>
                item.code.toString().includes(value)
            );
            setFilteredData(filtered);
        } else {
            // When search is cleared, show the current page's data
            fetchData();
        }
    };
    const fetchSearchData = async () => {
        setLoading(true);
        let allData = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            do {
                const res = await api()
                    .url(`/api/financial/?page=${currentPage}&fin_state=${fin_state}`)
                    .get()
                    .json();

                totalPages = Math.ceil(res.count / tableParams.pagination.pageSize);
                allData = [...allData, ...res.results];
                currentPage++;
            } while (currentPage <= totalPages);

            return allData.map((item) => ({
                key: item.id,
                ...item,
            }));
        } catch (error) {
            console.error("Error fetching all data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data) {
            const initialPrintRefs = data.reduce((acc, record) => {
                acc[record.id] = React.createRef();
                return acc;
            }, {});
            setPrintRefs(initialPrintRefs);
            // Initialize filteredData with all data when data is first loaded
            setFilteredData(data);
        }
    }, [data]);

    useEffect(() => {
        if (filteredData) {
            const updatedPrintRefs = { ...printRefs };
            filteredData.forEach((item) => {
                if (!updatedPrintRefs[item.id]) {
                    updatedPrintRefs[item.id] = React.createRef();
                }
            });
            setPrintRefs(updatedPrintRefs);
        }
    }, [filteredData]);

    const handleModalChange = (newState) => {
        setIsModalOpen(newState);
        fetchData();
    };
    const downloadExcel = async (financialId, username) => {
        try {
            const response = await api().url(`/api/generate-excel/${financialId}/`).get().blob();
            const blob = new Blob([response], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${username}_${financialId}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            message.success('Excel file downloaded successfully');
        } catch (error) {
        }
    };

    // Usage
    function update_fin(id) {
        let xit = data.filter((item) => {
            if (item.id === id) {
                item.updated = Date.now()
            }
            return item;
        })
        setData(xit)
    }

    const showModal = (value) => {
        setselectedid(value.id)
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const onchangestate = (e, record) => {
        api().url(`/api/financial/${record.id}/`).patch({
            "fin_state": e.target.value
        }).json().then((res) => {
            console.log(res);
            fetchData();
        })
    }

    const columns = [
        {
            title: "شماره سند",
            dataIndex: "code",
            key: "code",
            sorter: (a, b) => b.code - a.code,
        },
        // { title: 'شماره سند', dataIndex: 'id', key: 'id', },
        {
            title: 'نام سند',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) =>
                <a onClick={() => showModal(record)}>{toPersianNumbers(text)}</a>
        },
        {
            title: 'نوع هزینه',
            dataIndex: 'CostType',
            key: 'CostType',
            filters: [{ value: 'جاری', text: 'جاری' }, { value: 'عمرانی', text: 'عمرانی' }, {
                value: "متفرقه",
                text: "متفرقه"
            }, { value: "تجهیزات", text: "تجهیزات" }, { value: "خارج از شمول", text: "خارج از شمول" }],
            onFilter: (value, record) => record.CostType == value,
            render: (text) => text,
        }, {
            title: 'نوع پرداخت',
            dataIndex: 'Payment_type',
            key: 'Payment_type',
            filters: [
                {
                    text: 'مستقیم',
                    value: true,
                },
                {
                    text: "تنخواه",
                    value: false,
                },
            ],
            onFilter: (value, record) => record.Payment_type === value,
            render: (bool) => bool ? "مستقیم" : "تنخواه",
        },
        {
            title: 'تاریخ',
            dataIndex: 'date_doc',
            key: 'date_doc',
            render: (date) => {

                return new Intl.DateTimeFormat('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(date));

            }
        },
        {
            title: 'مبلغ',
            sorter: (a, b) => a.total_logistics_price - b.total_logistics_price,
            dataIndex: 'total_logistics_price',
            key: 'total_logistics_price',
            align: 'center',
            render: (x) => {
                return numberWithCommas(x.toLocaleString('fa-IR'))
            }
        },

        {
            title: 'سازنده',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: 'وضعیت',
            dataIndex: 'fin_state',
            hidden: fin_state === 2,
            key: 'fin_state',
            sorter: (a, b) => a.fin_state - b.fin_state,
            filters: [
                { text: "در دست اقدام", value: 0 },
                { text: "در حال بررسی", value: 1 },
                { text: "تایید", value: 2 },
            ],
            onFilter: (value, record) => record.fin_state === value,
            render: (fin_state, record) => {
                return <Radio.Group onChange={(e) => onchangestate(e, record)} defaultValue={fin_state}>
                    <Radio.Button value={2}>تایید</Radio.Button>
                    <Radio.Button value={0}>رد</Radio.Button>
                </Radio.Group>
            }
        },
        {
            title: 'اکسل',
            render: (record) => (
                <Button
                    icon={<DownloadOutlined />}
                    onClick={() => downloadExcel(record.id, record.user)}
                    disabled={record.Payment_type == false}
                />
            )
        },
        {
            title: "چاپ", key: 'print', align: 'center', render: (record) => {
                return <>
                    <div style={{ display: 'none' }}>
                        <Fin_last_print key={record.updated} ref={printRefs[record.id]} record={record} />
                    </div>
                    <ReactToPrint
                        pageStyle="@media print {
                                          html, body {
                                            height: 100vh; /* Use 100% here to support printing more than a single page*/
                                            margin: 0 !important;
                                            padding: 0 !important;
                                          }
                                             .no-wrap {
                                                white-space: nowrap;
                                            }
                                        }"
                        trigger={() => <Button icon={<PrinterOutlined />}></Button>}
                        content={() => printRefs[record.id].current}
                    />
                </>
            }
        }
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            ...sorter,
        })
    }

    const fetchData = () => {
        let url = `/api/financial/?page=${tableParams.pagination.current}&fin_state=${fin_state}`;

        // Add year filter if form_date is set
        if (form_date) {
            const jalaliYear = form_date.year(); // Get the Jalali year from the selected date
            url += `&date_doc_jalali_year=${jalaliYear}`;
        }

        api().url(url).get().json().then((res) => {
            let newdata = res.results.map(
                (item) => ({ "key": item.id, ...item })
            );
            newdata.map((item) => {
                printRefs[item.id] = React.createRef();
            });
            console.log(newdata);
            setData(newdata);
            setFilteredData(newdata);
            setLoading(false);
            setTableParams({
                ...tableParams,
                pagination: {
                    ...tableParams.pagination,
                    total: res.count,
                },
            });
        });

    };


    useEffect(() => {
        fetchData();
    }, [JSON.stringify(tableParams), fin_state, update, form_date]);

    const fetchAllData = async () => {
        setLoading(true);
        let allData = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            do {
                const res = await api()
                    .url(`/api/financial/?page=${currentPage}`)
                    .get()
                    .json();

                totalPages = Math.ceil(res.count / tableParams.pagination.pageSize);
                allData = [...allData, ...res.results];
                currentPage++;
            } while (currentPage <= totalPages);

            return allData.map((item) => ({
                key: item.id,
                ...item,
            }));
        } catch (error) {
            console.error("Error fetching all data:", error);
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = async () => {
        try {
            setLoading(true);
            message.loading('در حال آماده سازی گزارش اکسل، لطفا تا پایان فرآیند منتظر بمانید...', 0);

            // Fetch all financial data (not just current page)
            const allFinancialData = await fetchAllData();

            // Prepare Doc sheet data
            const docSheetData = allFinancialData.map((financial, index) => ({
                "ردیف": index + 1,
                "شماره سند": financial.code,
                "تاریخ سند": new Intl.DateTimeFormat('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(financial.date_doc)),
                "نوع سند": financial.CostType,
                "نوع پرداخت": financial.Payment_type ? "مستقیم" : "تنخواه",
                "شرح سند": financial.name,
                "مبلغ سند": financial.total_logistics_price,
                "وضعیت سند": financial.fin_state === 2 ? "تایید" : financial.fin_state === 1 ? "در حال بررسی" : "در دست اقدام",
                "کارپرداز": financial.user || '-',
                "کد مالیاتی": financial.tax || '-',
                "توضیحات": financial.descr || '-'
            }));

            // Prepare Madrak sheet data
            let madrakSheetData = [];
            for (const financial of allFinancialData) {
                const logisticsResponse = await api().url(`/api/logistics/?Fdoc_key=${financial.id}`).get().json();
                const logisticsItems = logisticsResponse.results;

                logisticsItems.forEach(logistic => {
                    madrakSheetData.push({
                        "شماره مدرک": logistic.id,
                        "شماره سند": financial.code,
                        "تاریخ مدرک": new Intl.DateTimeFormat('fa-IR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        }).format(new Date(logistic.date_doc)),
                        "نوع ارائه": logistic.type ? "کالا" : "خدمات",
                        "نام کالا/خدمات": logistic.name,
                        "کد ملی فروشنده": logistic.seller_id || '-',
                        "فروشگاه": logistic.seller || '-',
                        "محل هزینه": logistic.Location?.name || '-',
                        "در وجه": logistic.account_name || '-',
                        "بانک": logistic.bank_name || '-',
                        "شماره شبا": logistic.account_number ? `IR${logistic.account_number}` : '-',
                        "مبلغ": logistic.price,
                        "ارزش افزوده": logistic.vat || 0,
                        "توضیحات": logistic.descr || '-'
                    });
                });
            }

            // Get current Persian date
            const today = new Date();
            const persianDate = new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(today).replace(/\//g, '-');

            // Create workbook with two sheets
            const wb = XLSX.utils.book_new();

            // Create empty sheets
            const docSheet = XLSX.utils.aoa_to_sheet([[]]); 
            const madrakSheet = XLSX.utils.aoa_to_sheet([[]]);

            // Add Doc sheet data starting from A2
            XLSX.utils.sheet_add_aoa(docSheet, [[`گزارش اسناد هزینه کرد تدارکات تا تاریخ ${persianDate}`]], { origin: 'A1' });
            XLSX.utils.sheet_add_json(docSheet, docSheetData, { origin: "A2" });
            XLSX.utils.book_append_sheet(wb, docSheet, "Doc");

            // Add Madrak sheet data starting from A2
            XLSX.utils.sheet_add_aoa(madrakSheet, [[`گزارش ریز اسناد هزینه کرد تدارکات تا تاریخ ${persianDate}`]], { origin: 'A1' });
            XLSX.utils.sheet_add_json(madrakSheet, madrakSheetData, { origin: "A2" });
            XLSX.utils.book_append_sheet(wb, madrakSheet, "Madrak");

            // Generate Excel file
            const fileName = `Financial-Report-${persianDate}.xlsx`;
            XLSX.writeFile(wb, fileName);

            message.destroy();
            message.success('گزارش با موفقیت دانلود شد');
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            message.destroy();
            message.error('خطا در تولید گزارش اکسل');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className={"py-2"}>
                <span className={"float-end"}>
                    <span className={"h2 text-black"}> انتخاب سال </span>
                    <DatePickerJalali
                        picker="year"
                        defaultValue={form_date}
                        onChange={(e) => {
                            set_form_date(e);
                            fetchData();
                        }} />
                </span>
            </div>
            <Modal title="ویرایش سند" style={{ marginLeft: "-15%" }} centered open={isModalOpen}
                onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>
                <Financial_docs Fdata={data} selectedid={selectedid} modal={handleModalChange} />
            </Modal>
            <Radio.Group onChange={(e) => {
                setTableParams({
                    pagination: {
                        current: 1,
                        pageSize: 10,
                    },
                });
                set_fin_state(e.target.value)
            }} defaultValue={fin_state}>
                <Radio.Button value={1}>در حال بررسی</Radio.Button>
                <Radio.Button value={2}>تایید شده</Radio.Button>
            </Radio.Group>
            <Space className="pr-5">
                <Input
                    placeholder="جستجو بر اساس شماره سند"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 250 }}
                    allowClear
                />
            </Space>
            <button
                onClick={exportToExcel} title="Excel"
                className="text-center hover:bg-blue-500 transition-colors shadow-md mr-5 mb-5 py-2 px-3 bg-green-600 text-white rounded-lg"
                style={{
                    backgroundImage: "url(/images/Excel.png)", backgroundSize: "contain", backgroundRepeat: "no-repeat", paddingLeft: "48px",
                }}> اکسل
            </button>
            <Table
                columns={columns}
                dataSource={filteredData} // Use filteredData instead of data
                loading={loading}
                pagination={tableParams.pagination}
                expandable={{
                    expandedRowRender: (record) =>
                        <Fin_detail key={record.updated} record={record} form_date={form_date}
                            change_data={(id) => {
                                update_fin(id);
                            }}
                        />
                }}
                onChange={handleTableChange}
            />
        </>
    )
};
export default App;