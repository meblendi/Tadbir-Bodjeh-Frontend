"use client";
import { api } from "@/app/fetcher";
import Contract_Doc from "@/app/Financial/Contract/page";
import { Modal, message, Table, Input, Button } from "antd";
import React, { useEffect, useState } from "react";
import { numberWithCommas } from "@/app/Logistics/Print/page";
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

    // Password state
    const [password, setPassword] = useState("");
    const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isClient, setIsClient] = useState(false); // Track client-side rendering

    // Password check handler
    const handlePasswordSubmit = () => {
        if (password === "T20@24") {
            setIsPasswordCorrect(true);
            setIsPasswordModalOpen(false);
        } else {
            message.error("رمز عبور اشتباه است!");
        }
    };

    // Handle Enter key press
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handlePasswordSubmit();
        }
    };

    // Ensure password check runs only on the client side
    useEffect(() => {
        setIsClient(true); // Mark that the component is now on the client side
        setIsPasswordModalOpen(true); // Open the password modal on the client
    }, []);

    // Handlers for New Contract Modal
    const openNewContractModal = () => setIsNewContractModalOpen(true);
    const closeNewContractModal = () => {
        setIsNewContractModalOpen(false);
        window.location.reload();
    };

    // Handlers for Edit Document Modal
    const openEditDocumentModal = (value) => {
        setselectedid(value.id);
        setIsEditDocumentModalOpen(true);
    };
    const closeEditDocumentModal = () => {
        setIsEditDocumentModalOpen(false);
        window.location.reload();
    };

    const remove_item = (id) => {
        setData(data.filter((item) => item.id !== id));
    };

    const columns = [
        {
            title: "شماره",
            dataIndex: "id",
            key: "id",
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: "کد",
            dataIndex: "code",
            key: "code",            
        },
        {
            title: "عنوان",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <a onClick={() => openEditDocumentModal(record)}>{text}</a>
            ),
        },
        {
            title: "نوع قرار داد",
            dataIndex: "Contractor_level",
            key: "Contractor_level",
            render: (level) => {
                switch (level) {
                    case "a": return "قراردادها";
                    case "a1": return "شرکتهای تامین نیرو";
                    case "a2": return "کارکردهای ماهانه";
                    case "a3": return "انتظامات شب";
                    case "a4": return "سایر قراردادها";
                    case "b": return "طرح پژوهشی خارجی";
                    case "c": return "صورت وضعیت عمرانی";
                    case "d": return "کارکردهای متفرقه";
                    case "d1": return "کارکردهای متفرقه";
                    case "d2": return "کارکردهای متفرقه";
                    default: return "قراردادها";
                }
            },
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
            render: (price) => price !== null && price !== undefined ? numberWithCommas(price.toLocaleString("fa-IR")) : "نامشخص",
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
            ordering: sorter.order
                ? `${sorter.order === "ascend" ? "" : "-"}${sorter.field}`
                : null,
        });
    };

    const fetchData = (params = {}) => {
        setLoading(true);
        const orderingParam = params.ordering ? `&ordering=${params.ordering}` : "";
        api()
            .url(`/api/contract/?page=${params.page || tableParams.pagination.current}${orderingParam}`)
            .get()
            .json()
            .then((res) => {
                const formattedData = res.results.map((item) => ({
                    key: item.id,
                    ...item,
                }));
                setData(formattedData);
                setlocation(res.sub_units);
                setLoading(false);
                setTableParams({
                    ...tableParams,
                    pagination: {
                        ...tableParams.pagination,
                        current: params.page || tableParams.pagination.current,
                        total: res.count,
                    },
                });
            })
            .catch((error) => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
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
        if (isPasswordCorrect) {
            fetchData();
        }
    }, [updatedata, doc_state, isPasswordCorrect]);

    const exportToExcel = async () => {
        const allData = await fetchAllData();
        if (allData && allData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(allData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Contracts");
            XLSX.writeFile(wb, "Contracts_List.xlsx");
            message.success("فایل با موفقیت در پوشه Downloads ذخیره شد.");
        } else {
            console.error("No data available for export");
            message.error("هیچ داده ای برای ذخیره در دسترس نیست.");
        }
    };

    return (
        <>
            <main className="flex min-h-screen flex-col">
                {/* Password Modal */}
                {isClient && isPasswordModalOpen && (
                    <Modal
                        title="لطفا رمز عبور را وارد کنید"
                        open={isPasswordModalOpen}
                        onCancel={() => setIsPasswordModalOpen(false)}
                        footer={null}
                    >
                        <Input.Password
                            placeholder="رمز عبور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown} // Add keydown event handler
                            style={{ marginBottom: "16px" }}
                        />
                        <Button type="primary" onClick={handlePasswordSubmit}>
                            تایید
                        </Button>
                    </Modal>
                )}

                {/* Main Content */}
                {isPasswordCorrect && (
                    <div>
                        <button
                            onClick={openNewContractModal}
                            title="Add Contract"
                            className="text-center hover:bg-green-500 transition-colors shadow-md mb-5 py-2 px-3 bg-blue-500 text-white rounded-lg"
                        >
                            ثبت قرارداد جدید
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
                            <Contract_Doc
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
                            <Contract_Doc
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
                            onChange={handleTableChange}
                        />
                    </div>
                )}
            </main>
        </>
    );
};

export default App;