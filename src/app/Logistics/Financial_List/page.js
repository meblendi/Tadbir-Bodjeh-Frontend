"use client";
import { api } from "@/app/fetcher";
import Financial_docs from "@/app/Logistics/Financial_docs/page";
import Fin_detail from "@/app/Logistics/Financial_List/details0";
import Fin_print, { numberWithCommas } from "@/app/Logistics/Print/page";
import { CalculatorOutlined, PrinterOutlined, SearchOutlined } from "@ant-design/icons";
import { Button, Modal, message, Radio, Table, Input, Space } from "antd";
import React, { useEffect, useState } from "react";
import ReactToPrint from "react-to-print";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import * as XLSX from 'xlsx';

const App = (props) => {
    const [data, setData] = useState();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedid, setselectedid] = useState(0);
    const [fin_state, set_fin_state] = useState(0);
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

    // Handle search
    const handleSearch = (value) => {
        setSearchText(value);
        setTableParams({
            ...tableParams,
            pagination: {
                ...tableParams.pagination,
                current: 1,
            },
        });
        if (value) {
            const filtered = data.filter(item =>
                item.code.toString().toLowerCase().includes(value.toLowerCase())
            );
            setFilteredData(filtered);
        } else {
            setFilteredData(data);
        }
    };

    // Update print refs when data changes
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
    const onchangestate = (e, record) => {
        api().url(`/api/financial/${record.id}/`).patch({
            "fin_state": 1
        }).json().then((res) => {
            fetchData();
        })
    }
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
                <a onClick={() => showModal(record)}>{text}</a>
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
        },
        {
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
            title: "چاپ", key: 'print', align: 'center', render: (record) => {

                return < >
                    <div style={{ display: 'none' }}>
                        <Fin_print key={record.updated} ref={printRefs[record.id]} record={record} />
                    </div>
                    <ReactToPrint
                        pageStyle="@media print {
                                          html, body {
                                            height: 100vh; /* Use 100% here to support printing more than a single page*/
                                            margin: 0 !important;
                                            padding: 0 !important;
                                            overflow: hidden;

                                          }
                                             .no-wrap {
                                                white-space: nowrap;
                                            }



                                        }"
                        trigger={() => <Button icon={<PrinterOutlined />}>پرینت</Button>}
                        content={() => printRefs[record.id].current}

                    /></>
            }
        },

        {
            title: "ارسال به امور مالی", key: 'fin', align: 'center', hidden: fin_state !== 0, render: (record) => {
                return <Button onClick={(e) => {
                    onchangestate(e, record)
                }} icon={<CalculatorOutlined />}>ارسال</Button>
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

    const exportToExcel = async () => {
        try {
            // Show loading message
            message.loading({ content: 'در حال دریافت اطلاعات از سرور...', key: 'excel', duration: 0 });

            let allData = [];
            let totalRecords = 0;
            let totalPages = 1;

            // Build initial URL without modifying it
            let urlParams = '';
            if (form_date) {
                const jalaliYear = form_date.year();
                urlParams += `&date_doc_jalali_year=${jalaliYear}`;
            }

            // First request to get total count
            const initialResponse = await api().url(`/api/financial/?${urlParams}`).get().json();
            totalRecords = initialResponse.count;
            totalPages = Math.ceil(totalRecords / 10); // Assuming page size is 10
            allData = [...initialResponse.results];

            // Fetch remaining pages sequentially
            for (let page = 2; page <= totalPages; page++) {
                try {
                    if (page < totalPages) {
                        message.loading({
                            content: `در حال دریافت ${totalRecords} رکورد (صفحه ${page} از ${totalPages})...`,
                            key: 'excel'
                        });
                    }

                    const response = await api().url(`/api/financial/?page=${page}&${urlParams}`).get().json();
                    allData = [...allData, ...response.results];
                } catch (error) {
                    console.error(`Error fetching page ${page}:`, error);
                    message.warning({
                        content: `خطا در دریافت صفحه ${page} - ادامه فرآیند...`,
                        key: 'excel',
                        duration: 2
                    });
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            // Verify we got all records
            if (allData.length < totalRecords) {
                message.warning({
                    content: `توجه: ${totalRecords - allData.length} رکورد دریافت نشد`,
                    key: 'excel',
                    duration: 3
                });
            }

            // Prepare Excel data
            message.loading({ content: 'در حال تولید فایل اکسل...', key: 'excel' });

            const excelData = allData.map((item, index) => ({
                "ردیف": index + 1,
                "شماره سند": item.code,
                "تاریخ سند": item.date_doc ? new Intl.DateTimeFormat('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(item.date_doc)) : '',
                "نوع سند": item.CostType,
                "نوع پرداخت": item.Payment_type ? "مستقیم" : "تنخواه",
                "شرح سند": item.name,
                "مبلغ سند": item.total_logistics_price || 0,
                "وضعیت سند": item.fin_state === 0 ? "در دست اقدام" :
                    item.fin_state === 1 ? "در حال بررسی" : "تایید نهایی",
                "کارپرداز": item.user || '-',
                "کد مالیاتی": item.tax || '-',
                "توضیحات": item.descr || '-'
            }));

            // Create and download Excel file
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(wb, ws, "اسناد مالی");

            const fileName = `اسناد_مالی_${form_date ? form_date.year() : dayjs().year()}.xlsx`;
            XLSX.writeFile(wb, fileName);

            message.success({
                content: `فایل اکسل با ${allData.length} رکورد با موفقیت ذخیره شد`,
                key: 'excel',
                duration: 4
            });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            message.error({
                content: 'خطا در تولید فایل اکسل',
                key: 'excel',
                duration: 3
            });
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
                <Radio.Button value={0}>در دست اقدام</Radio.Button>
                <Radio.Button value={1}>در حال بررسی</Radio.Button>
                <Radio.Button value={2}>تایید نهایی</Radio.Button>

            </Radio.Group>
            <Space className="pr-5 pb-5">
                <Input
                    placeholder="جستجو بر اساس شماره سند"
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    style={{ width: 200 }}
                    allowClear
                />
            </Space>
            <button
                onClick={exportToExcel}
                title="Excel"
                className="text-center hover:bg-blue-500 transition-colors shadow-md mr-5 mb-5 py-2 px-3 bg-green-600 text-white rounded-lg"
                style={{
                    backgroundImage: "url(/images/Excel.png)",
                    backgroundSize: "contain",
                    backgroundRepeat: "no-repeat",
                    paddingLeft: "48px",
                }}>
                اکسل
            </button>
            <Table columns={columns} dataSource={filteredData} loading={loading} pagination={tableParams.pagination}
                expandable={{
                    expandedRowRender: (record) => <Fin_detail
                        change_data={(id) => {
                            update_fin(id);
                        }}
                        key={`${record.id}-${record.updated}`}
                        record={record}
                    />,
                }}
                onChange={handleTableChange} />
        </>
    )
};
export default App;