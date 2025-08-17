"use client";
import { api } from "@/app/fetcher";
import Night_Staff_Doc from "@/app/Financial/Contract/Add_053_Night_Staff/page";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import { Modal, message, Table } from "antd";
import React, { useEffect, useState } from "react";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import * as XLSX from "xlsx";


const App = () => {
    const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
    const [isEditDocumentModalOpen, setIsEditDocumentModalOpen] = useState(false);
    const [updatedata, setupdatedata] = useState(false);
    const [data, setData] = useState([]);
    const [location, setlocation] = useState([]);
    const [selectedid, setselectedid] = useState(0);
    const [loading, setLoading] = useState(false);
    const [doc_state, set_doc_state] = useState("?get_nulls=true");
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });

    const [update, set_update] = useState(0);
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa'); // Set the locale to Persian/Farsi
    dayjs["calendar"]('jalali');
    const [form_date, set_form_date] = useState(dayjs(new Date()))

    // Handlers for New Contract Modal
    const openNewContractModal = () => setIsNewContractModalOpen(true);
    const closeNewContractModal = () => {
        setIsNewContractModalOpen(false);
        window.location.reload(); // Refresh the page
    };
    // Handlers for Edit Document Modal
    const openEditDocumentModal = (value) => {
        setselectedid(value.id);
        setIsEditDocumentModalOpen(true);
    };
    const closeEditDocumentModal = () => {
        setIsEditDocumentModalOpen(false);
        window.location.reload(); // Refresh the page
    };

    const remove_item = (id) => {
        setData(data.filter((item) => item.id !== id));
    };

    const columns = [
        {
            title: "کد",
            dataIndex: "code",
            key: "code",            
        },
        // {title: "ردیف", dataIndex: "number", key: "number", },
        // {title: "کد", dataIndex: "id", key: "id", sorter: (a, b) => a.id - b.id,},
        {
            title: "عنوان",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <a onClick={() => openEditDocumentModal(record)}>{text}</a>
            ),
        },

        {
            title: "نوع خدمات",
            dataIndex: "contractor_type_name",
            key: "contractor_type_name",

        },

        {
            title: "طرف قرارداد",
            dataIndex: "Contractor",
            key: "Contractor",
        },
        {
            title: "مبلغ کل قرارداد",
            dataIndex: "total_contract_amount",
            key: "total_contract_amount",
            render: (price) => numberWithCommas(price.toLocaleString("fa-IR")),
            sorter: (a, b) => a.price - b.price,
        },
        {
            title: "مبلغ پرداخت شده",
            dataIndex: "paid_amount",
            key: "paid_amount",
            render: (price) => numberWithCommas(price.toLocaleString("fa-IR")),

        },
        {
            title: "تاریخ",
            dataIndex: "document_date",
            key: "document_date",
            render: (date) =>
                new Intl.DateTimeFormat("fa-IR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                }).format(new Date(date)),
        },
        {
            title: "مدارک",
            dataIndex: "uploads",
            key: "uploads",
            render: (u) =>
                u
                    ? u.map((upload) => (
                        <div key={upload.id}>
                            <a href={upload.file}>{upload.name}</a>
                        </div>
                    ))
                    : null,
        },
    ];

    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination: {
                ...tableParams.pagination,
                current: pagination.current,
            },
            filters,
            sorter,
        });

        fetchData({
            page: pagination.current,
            ordering: sorter.field === "document_date"
                ? `${sorter.order === "ascend" ? "" : "-"}document_date`
                : null,
        });
    };


    const fetchData = async (params = {}) => {
        setLoading(true);

        let Year = dayjs(form_date).format("YYYY"); // Get selected year
        const orderingParam = params.ordering ? `&ordering=${params.ordering}` : "";

        let allData = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            do {
                const res = await api()
                    .url(`/api/contract/?page=${currentPage}${orderingParam}`)
                    .get()
                    .json();

                totalPages = Math.ceil(res.count / tableParams.pagination.pageSize);
                allData = [...allData, ...res.results];
                currentPage++;
            } while (currentPage <= totalPages);

            // 🌟 Ensure only documents from the selected year (1403, etc.) are shown
            const filteredData = allData
                .filter(item =>
                    item.Contractor_level === "a3" &&
                    dayjs(item.document_date).format("YYYY") === Year // Compare document year
                )
                .sort((a, b) => new Date(b.document_date) - new Date(a.document_date)); // Sort by date

            // Reverse numbering
            const totalRecords = filteredData.length;
            const formattedData = filteredData.map((item, index) => ({
                key: item.id,
                number: totalRecords - index, // Reverse row number
                ...item,
            }));

            setData(formattedData);
            setlocation(allData.sub_units);
            setLoading(false);

            setTableParams({
                ...tableParams,
                pagination: {
                    ...tableParams.pagination,
                    current: params.page || tableParams.pagination.current,
                    total: filteredData.length,
                },
            });
        } catch (error) {
            console.error("Error fetching data:", error);
            setLoading(false);
        }
    };

    const fetchAllData = async () => {
        setLoading(true);
        let allData = [];
        let currentPage = 1;
        let totalPages = 1;

        try {
            do {
                const res = await api()
                    .url(`/api/contract/?page=${currentPage}`)
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
        fetchData();
    }, [update, updatedata, doc_state, form_date]);

    const exportToExcel = async () => {
        const allData = await fetchAllData(); // Fetch all pages of data
        if (allData && allData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(allData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contracts");
            XLSX.writeFile(wb, "051-Supply_Companies.xlsx");

            // Show success message
            message.success("فایل با موفقیت در پوشه Downloads ذخیره شد.");
        } else {
            console.error("No data available for export");
            message.error("هیچ داده ای برای ذخیره در دسترس نیست."); // Optional: Show error message
        }
    };

    return (
        <>
            <main className="flex min-h-screen flex-col">
                <div>
                    <div className={"py-2"}>
                        <span className={"float-end"}>
                            <span className={"h2 text-black"}>  انتخاب سال </span>
                            <DatePickerJalali
                                picker="year"
                                defaultValue={form_date}
                                onChange={(e) => {
                                    set_form_date(e);
                                    fetchData(); // Fetch data for the selected year
                                }}
                            />
                        </span>
                    </div>
                    <button
                        onClick={openNewContractModal} title="Add Contract"
                        className="text-center hover:bg-green-500 transition-colors shadow-md mb-5 py-2 px-3 bg-blue-500 text-white rounded-lg"
                    >
                        ثبت قرارداد جدید
                    </button>
                    <button
                        onClick={exportToExcel} title="Excel"
                        className="text-center hover:bg-blue-500 transition-colors shadow-md mr-5 mb-5 py-2 px-3 bg-green-600 text-white rounded-lg"
                        style={{
                            backgroundImage: "url(/images/Excel.png)",
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            paddingLeft: "48px", // Adjust for image spacing                            
                        }}
                    >
                        اکسل
                    </button>


                    <Modal
                        title="ثبت قرارداد"
                        style={{ marginLeft: "-15%" }}
                        centered
                        open={isNewContractModalOpen}
                        onOk={closeNewContractModal}
                        onCancel={closeNewContractModal}
                        footer={null}
                        width={"75%"}
                        zIndex={100}
                    >
                        <Night_Staff_Doc
                            Fdata={
                                selectedid
                                    ? data.find((item) => item.id === selectedid)
                                    : null
                            }
                            selectedid={selectedid}
                            modal={setIsNewContractModalOpen}
                            location={location}
                            update={() => console.log("Update logic here")}
                        />
                    </Modal>
                </div>
                <div>
                    <Modal
                        title="ویرایش قرارداد"
                        style={{ marginLeft: "-15%" }}
                        centered
                        open={isEditDocumentModalOpen}
                        onOk={closeEditDocumentModal}
                        onCancel={closeEditDocumentModal}
                        footer={null}
                        width={"75%"}
                        zIndex={100}
                    >
                        <Night_Staff_Doc
                            Fdata={data}
                            selectedid={selectedid}
                            modal={setIsEditDocumentModalOpen}
                            remove={remove_item}
                            location={location}
                            update={() => setupdatedata(!updatedata)}
                        />
                    </Modal>
                    <Table
                        columns={columns}
                        dataSource={data}
                        pagination={tableParams.pagination}
                        loading={loading}
                        onChange={handleTableChange} />
                </div>
            </main>
        </>
    );
};

export default App;
