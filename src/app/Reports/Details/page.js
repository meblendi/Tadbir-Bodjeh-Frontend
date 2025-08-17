"use client";
import { api } from "@/app/fetcher";
import Logistics_Doc from "@/app/Logistics/Docs/page";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import { Modal, message, Radio, Table, Form, InputNumber, Select, Col, Row } from "antd";
import React, { useEffect, useState } from "react";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import * as XLSX from 'xlsx'; // Add this import

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

const App = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatedata, setupdatedata] = useState(false);
    const [data, setData] = useState([]);
    const [selectedid, setselectedid] = useState(0);
    const [loading, setLoading] = useState(false);
    const [doc_state, set_doc_state] = useState("?get_nulls=false");
    const [type, settype] = useState("");
    const [fin_state, setfin_state] = useState("");
    const [organization, setorganization] = useState([]);
    const [selectedOrganization, setSelectedOrganization] = useState([]);
    const [unit, setunit] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState([]);
    const [location, setlocation] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1, pageSize: 10,
        },
    });

    const [totalPrice, setTotalPrice] = useState(0);
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale("fa"); // Set the locale to Persian/Farsi
    dayjs["calendar"]("jalali");
    const [form_date, set_form_date] = useState(dayjs(new Date()));

    const handleModalChange = (newState) => {
        setIsModalOpen(newState);
    };
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
    
    useEffect(() => {
        let Year = form_date.format("YYYY");
        api().url("/api/organization?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
            setorganization(r);
        });
    }, [form_date]);
    useEffect(() => {
        let Year = form_date.format("YYYY");
        let url = "/api/unit?no_pagination=true" + `&year=${Year}`;
        // Only add organization filter if an organization is selected
        if (selectedOrganization) {
            url += `&organization=${selectedOrganization}`;
        }
        api().url(url).get().json().then(r => {
            setunit(r);
            // Clear selected unit when organization changes
            setSelectedUnit(null);
        });
    }, [form_date, selectedOrganization]);
    useEffect(() => {
        let Year = form_date.format("YYYY");
        let url = "/api/subUnit?no_pagination=true" + `&year=${Year}`;
        // Only add organization filter if an organization is selected
        if (selectedOrganization) {
            url += `&unit__organization=${selectedOrganization}`;
        }
        // Only add unit filter if an unit is selected
        if (selectedUnit) {
            url += `&unit=${selectedUnit}`;
        }
        api().url(url).get().json().then(r => {
            setlocation(r);
            // Clear selected Location when unit changes
            setSelectedLocation(null);
        });
    }, [form_date, selectedOrganization, selectedUnit]);

    const fetchData = () => {
        setLoading(true);
        let url = `/api/logistics/${doc_state}&page=${tableParams.pagination.current}`;

        // Add year filter if form_date is set
        if (form_date) {
            const jalaliYear = form_date.year(); // Get the Jalali year from the selected date
            url += `&date_doc_jalali_year=${jalaliYear}`;
        }
        // Add fin_state filter if fin_state is set
        if (fin_state) { url += `&Fdoc_key__fin_state=${fin_state}`; }
        // Add type filter if type is set
        if (type) { url += `&type=${type}`; }
        // Add Organization filter if selected
        if (selectedOrganization) { url += `&Location__unit__organization=${selectedOrganization}`; }
        // Add Unit filter if selected
        if (selectedUnit) { url += `&Location__unit=${selectedUnit}`; }
        // Add location filter if selected
        if (selectedLocation) { url += `&Location=${selectedLocation}`; }

        api().url(url).get().json().then((res) => {
            let newdata = res.results.map(
                (item) => ({ "key": item.id, ...item })
            );
            setData(newdata);
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
    }, [JSON.stringify(tableParams), updatedata, doc_state, form_date, fin_state, type, selectedOrganization, selectedUnit, selectedLocation]);


    const columns = [{
        title: 'شماره',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'نام کالا/خدمات\n', dataIndex: 'name', key: 'name', render: (text, record) => {
            return <>
                <a onClick={() => showModal(record)}>{text}</a>
            </>
        }
    },
    {
        title: 'شماره سند',
        dataIndex: 'Fdoc_key',
        key: 'Fdoc_key',
        hidden: "?get_nulls=true" === doc_state,
        render: (Fdoc_key) => Fdoc_key ? Fdoc_key.code : '-',
    },
    {
        title: 'وضعیت سند',
        dataIndex: 'Fdoc_key',
        key: 'Fdoc_key',
        hidden: "?get_nulls=true" === doc_state,
        render: (Fdoc_key) => {
            if (!Fdoc_key || Fdoc_key.fin_state === undefined) return '-';
            return Fdoc_key.fin_state === 2 ? "تایید شده" :
                Fdoc_key.fin_state === 1 ? "در حال بررسی" :
                    "در دست اقدام";
        }
    },
    {
        title: 'نوع ارائه', dataIndex: 'type', key: 'type',
        render: (bool) => bool ? "کالا" : "خدمات",
    },
    {
        title: 'ارائه دهنده', dataIndex: 'seller', key: 'seller',
    },
    {
        title: 'محل هزینه',
        dataIndex: "Location",
        key: "Location",
        render: (text, record) => {
            return record.Location ? record.Location.name : "-";
        },
    },
    {
        title: 'قیمت', dataIndex: 'price', key: 'price',
        render: (price) => numberWithCommas(price.toLocaleString('fa-IR')),
    },
    {
        title: 'تاریخ', dataIndex: 'date_doc', key: 'date_doc', render: (date) => {
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date(date));
        }
    },
    {
        title: 'سازنده',
        dataIndex: 'user',
        key: 'user',
        // eslint-disable-next-line react/jsx-key
    },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setupdatedata(!updatedata)
        setTableParams({
            pagination, filters, ...sorter,
        })
    }


    const exportToExcel = async () => {
        try {
            message.loading({ content: 'در حال دریافت اطلاعات از سرور...', key: 'excel', duration: 0 });

            let allData = [];
            let totalRecords = 0;
            let totalPages = 1;

            // Construct the base URL exactly like in fetchData
            let url = `/api/logistics/${doc_state}&page=1`;

            // Add filters exactly like in fetchData
            if (form_date) {
                const jalaliYear = form_date.year();
                url += `&date_doc_jalali_year=${jalaliYear}`;
            }
            if (fin_state) { url += `&Fdoc_key__fin_state=${fin_state}`; }
            if (type) { url += `&type=${type}`; }
            if (selectedOrganization) { url += `&Location__unit__organization=${selectedOrganization}`; }
            if (selectedUnit) { url += `&Location__unit=${selectedUnit}`; }
            if (selectedLocation) { url += `&Location=${selectedLocation}`; }

            // First request to get total count
            const initialResponse = await api().url(url).get().json();
            totalRecords = initialResponse.count;
            totalPages = Math.ceil(totalRecords / initialResponse.results.length); // Use actual page size from response
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

                    // Construct URL for each page
                    let pageUrl = `/api/logistics/${doc_state}&page=${page}`;

                    // Add filters for each page request
                    if (form_date) {
                        const jalaliYear = form_date.year();
                        pageUrl += `&date_doc_jalali_year=${jalaliYear}`;
                    }
                    if (fin_state) { pageUrl += `&Fdoc_key__fin_state=${fin_state}`; }
                    if (type) { pageUrl += `&type=${type}`; }
                    if (selectedOrganization) { pageUrl += `&Location__unit__organization=${selectedOrganization}`; }
                    if (selectedUnit) { pageUrl += `&Location__unit=${selectedUnit}`; }
                    if (selectedLocation) { pageUrl += `&Location=${selectedLocation}`; }

                    const response = await api().url(pageUrl).get().json();
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

            const excelData = allData.map(item => ({
                "شماره مدرک": item.id,
                "نام کالا/خدمات": item.name || '',
                "شماره سند": item.Fdoc_key?.code || '',
                "وضعیت سند": item.Fdoc_key.fin_state === 2 ? "تایید شده" :
                    item.Fdoc_key.fin_state === 1 ? "در حال بررسی" :
                        "در دست اقدام",
                "نوع ارائه": item.type ? "کالا" : "خدمات",
                "ارائه دهنده": item.seller || '',
                "کد ملی فروشنده": item.seller_id || '',
                "محل هزینه": item.Location?.name || '',
                "در وجه": item.account_name || '',
                "بانک": item.bank_name || '',
                "شماره شبا": item.account_number || '',
                "مبلغ": item.price || 0,
                "تاریخ مدرک": item.date_doc ? new Intl.DateTimeFormat('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(item.date_doc)) : '',
                "سازنده": item.user || '',
                "ارزش افزوده": item.vat || 0,
                "توضیحات": item.descr || ''
            }));

            // Create and download Excel file
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);
            XLSX.utils.book_append_sheet(wb, ws, "Madrak");
            XLSX.writeFile(wb, `Logistics_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);

            message.success({ content: `فایل اکسل با ${allData.length} رکورد با موفقیت ذخیره شد`, key: 'excel', duration: 4 });
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            message.error({ content: 'خطا در تولید فایل اکسل', key: 'excel', duration: 3 });
        }
    };

    const fetchAllDataAndCalculateSum = async () => {
        try {
            message.loading({ content: 'در حال محاسبه مجموع هزینه‌ها، لطفا تا پایان فرایند منتظر بمانید...', key: 'sum' });

            let allData = [];
            let totalRecords = 0;
            let totalPages = 1;

            // Construct the base URL exactly like in fetchData
            let url = `/api/logistics/${doc_state}&page=1`;

            // Add filters exactly like in fetchData
            if (form_date) {
                const jalaliYear = form_date.year();
                url += `&date_doc_jalali_year=${jalaliYear}`;
            }
            if (fin_state) { url += `&Fdoc_key__fin_state=${fin_state}`; }
            if (type) { url += `&type=${type}`; }
            if (selectedOrganization) { url += `&Location__unit__organization=${selectedOrganization}`; }
            if (selectedUnit) { url += `&Location__unit=${selectedUnit}`; }
            if (selectedLocation) { url += `&Location=${selectedLocation}`; }

            // First request to get total count
            const initialResponse = await api().url(url).get().json();
            totalRecords = initialResponse.count;
            totalPages = Math.ceil(totalRecords / initialResponse.results.length); // Use actual page size from response
            allData = [...initialResponse.results];

            // Fetch remaining pages sequentially
            for (let page = 2; page <= totalPages; page++) {
                try {
                    // Update loading message for pages after the first
                    if (page > 2) {
                        message.loading({
                            content: `در حال دریافت اطلاعات (صفحه ${page} از ${totalPages})...`,
                            key: 'sum'
                        });
                    }

                    // Construct URL for each page with current page number
                    let pageUrl = `/api/logistics/${doc_state}&page=${page}`;

                    // Add filters for each page request
                    if (form_date) {
                        const jalaliYear = form_date.year();
                        pageUrl += `&date_doc_jalali_year=${jalaliYear}`;
                    }
                    if (fin_state) { pageUrl += `&Fdoc_key__fin_state=${fin_state}`; }
                    if (type) { pageUrl += `&type=${type}`; }
                    if (selectedOrganization) { pageUrl += `&Location__unit__organization=${selectedOrganization}`; }
                    if (selectedUnit) { pageUrl += `&Location__unit=${selectedUnit}`; }
                    if (selectedLocation) { pageUrl += `&Location=${selectedLocation}`; }

                    const response = await api().url(pageUrl).get().json();
                    allData = [...allData, ...response.results];

                    // Small delay to avoid overwhelming the server
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (error) {
                    console.error(`Error fetching page ${page}:`, error);
                    message.warning({
                        content: `خطا در دریافت صفحه ${page} - ادامه فرآیند...`,
                        key: 'sum',
                        duration: 2
                    });
                }
            }

            // Calculate total sum
            const sum = allData.reduce((acc, item) => acc + (item.price || 0), 0);
            setTotalPrice(sum);

            // Verify we got all records
            if (allData.length < totalRecords) {
                message.warning({
                    content: `توجه: ${totalRecords - allData.length} رکورد در محاسبه لحاظ نشد`,
                    key: 'sum',
                    duration: 3
                });
            }

            message.success({
                content: `مجموع هزینه‌ها: ${sum.toLocaleString('fa-IR')} ریال`,
                key: 'sum',
                duration: 4
            });
        } catch (error) {
            console.error('Error calculating total:', error);
            message.error({
                content: 'خطا در محاسبه مجموع',
                key: 'sum',
                duration: 3
            });
        }
    };

    return (<>
        <div className={""}>
            <span className={"float-end"}>
                <span className={"h2 text-black"}> انتخاب سال : </span>
                <DatePickerJalali
                    picker="year"
                    defaultValue={form_date}
                    onChange={(e) => {
                        set_form_date(e);
                        fetchData();
                    }} />
            </span>
        </div>
        <Modal title="ویرایش مدارک" style={{ marginLeft: "-15%" }} centered open={isModalOpen}
            onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>


            <Logistics_Doc
                Fdata={data}
                selectedid={selectedid}
                modal={handleModalChange}                
                location={location}                
            />


        </Modal>
        <Row gutter={50}>
            <Form.Item label="وضعیت سند" style={{ marginLeft: "40px" }}>
                <Radio.Group
                    onChange={(e) => {
                        setTableParams({
                            pagination: {
                                current: 1,
                                pageSize: 10,
                            },
                        });
                        setfin_state(e.target.value);
                    }}
                    value={fin_state}>
                    <Radio.Button value="">همه</Radio.Button>
                    <Radio.Button value="2">تایید شده</Radio.Button>
                    <Radio.Button value="1">در حال بررسی</Radio.Button>
                    <Radio.Button value="0">در دست اقدام</Radio.Button>
                </Radio.Group></Form.Item>
            <Form.Item label="نوع ارائه" style={{ marginRight: "40px" }}>
                <Radio.Group
                    onChange={(e) => {
                        setTableParams({
                            pagination: {
                                current: 1,
                                pageSize: 10,
                            },
                        });
                        settype(e.target.value);
                    }}
                    value={type}>
                    <Radio.Button value="">همه</Radio.Button>
                    <Radio.Button value="True">کالا</Radio.Button>
                    <Radio.Button value="False">خدمات</Radio.Button>
                </Radio.Group></Form.Item>
        </Row>
        <Row gutter={50}>
            <Col span={8}>
                <Form.Item name="Location" label="معاونت / دانشکده">
                    <Select
                        showSearch
                        filterOption={filterOption}
                        placeholder="انتخاب معاونت / دانشکده"
                        onChange={(value) => {
                            setTableParams({
                                pagination: {
                                    current: 1,
                                    pageSize: 10,
                                },
                            });
                            setSelectedOrganization(value);
                            setSelectedLocation(null);
                            setSelectedUnit(null);
                            fetchData();
                        }}
                        options={organization.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                        onClear={() => {
                            setSelectedOrganization(null);
                            setSelectedLocation(null);
                            setSelectedUnit(null);
                            fetchData();
                        }}
                    />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name="Location" label="واحد">
                    <Select
                        showSearch
                        filterOption={filterOption}
                        placeholder="انتخاب واحد"
                        onChange={(value) => {
                            setTableParams({
                                pagination: {
                                    current: 1,
                                    pageSize: 10,
                                },
                            });
                            setSelectedUnit(value);
                            setSelectedLocation(null);
                            fetchData();
                        }}
                        options={unit.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                        onClear={() => {
                            setSelectedUnit(null);
                            setSelectedLocation(null);
                            fetchData();
                        }}
                    />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name="Location" label="محل هزینه">
                    <Select
                        showSearch
                        filterOption={filterOption}
                        placeholder="انتخاب محل هزینه"
                        onChange={(value) => {
                            setTableParams({
                                pagination: {
                                    current: 1,
                                    pageSize: 10,
                                },
                            });
                            setSelectedLocation(value);
                            fetchData();
                        }}
                        options={location.map((item) => ({
                            label: item.name,
                            value: item.id,
                        }))}
                        allowClear
                        onClear={() => {
                            setSelectedLocation(null);
                            fetchData();
                        }}
                    />
                </Form.Item>
            </Col></Row>
        <div style={{ display: "flex", gap: "10px" }}>
            <Col span={8}><Form.Item label="هزینه کرد">
                <InputNumber
                    value={totalPrice}
                    addonAfter={"﷼"}
                    formatter={(value) => toPersianNumbers(numberWithCommas(Math.floor(value)))}
                    style={{ width: "100%" }}
                    readOnly
                />
            </Form.Item></Col>
            <button
                onClick={fetchAllDataAndCalculateSum}
                title="Excel"
                className="text-center bg-blue-500 transition-colors shadow-md mr-5 mb-5 px-2 hover:bg-green-600 text-white rounded-lg"
            >
                محاسبه کن
            </button>
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
        </div>
        <Table
            columns={columns}
            dataSource={data}
            loading={loading}
            pagination={tableParams.pagination}
            onChange={handleTableChange} />
    </>)
};
export default App;