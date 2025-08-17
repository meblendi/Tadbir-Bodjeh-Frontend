"use client";
import { api } from "@/app/fetcher";
import Logistics_Doc from "@/app/Logistics/Docs/page";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import { Modal, message, Radio, Table } from "antd";
import React, { useEffect, useState } from "react";
import * as XLSX from 'xlsx'; // Add this import

const App = ({ }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatedata, setupdatedata] = useState(false);
    const [data, setData] = useState([]);
    const [location, setlocation] = useState([]);
    const [selectedid, setselectedid] = useState(0);
    const [loading, setLoading] = useState(false);
    const [doc_state, set_doc_state] = useState("?get_nulls=true");
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1, pageSize: 10,
        },
    });

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
    const remove_item = (id) => {
        setData(
            data.filter((item) => item.id !== id)
        )
    }
    const updateLocationInData = (id, locationLabel) => {
        setData((prevData) => {
            const updatedData = prevData.map((item) =>
                item.id === id ? { ...item, Location: locationLabel } : item
            );
            console.log("Updated Data:", updatedData); // Check updated state
            return updatedData;
        });
    };


    const columns = [{
        title: 'شماره',
        dataIndex: 'id',
        key: 'id',
    },
    {
        title: 'نام کالا/خدمات\n', dataIndex: 'name', key: 'name', render: (text, record) => {
            // setselectedid(record.id)
            return <>
                <a onClick={() => showModal(record)}>{text}</a>
            </>
        }
    },
    {
        title: 'نوع ارائه', dataIndex: 'type', key: 'type',
        filters: [
            {
                text: 'کالا',
                value: true,
            },
            {
                text: "خدمات",
                value: false,
            },
        ],
        onFilter: (value, record) => record.type === value,
        render: (bool) => bool ? "کالا" : "خدمات",
    },
    {
        title: 'کد ملی/ شناسه\n', dataIndex: 'seller_id', key: 'seller_id',
    },
    {
        title: 'ارائه دهنده', dataIndex: 'seller', key: 'seller',
    },

    {
        title: 'محل هزینه',
        dataIndex: "Location",
        key: "Location",
        render: (text, record) => {
            // Assuming `record.Location` contains the full Location object
            return record.Location ? record.Location.name : "-";
        },
    },

    {
        title: 'قیمت', dataIndex: 'price', key: 'price',
        render: (price) => numberWithCommas(price.toLocaleString('fa-IR')),
        sorter: (a, b) => a.price - b.price,
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
    {
        title: 'سند',
        dataIndex: 'Fdoc_key',
        key: 'Fdoc_key',
        hidden: "?get_nulls=true" === doc_state,
        render: (Fdoc_key) => Fdoc_key ? Fdoc_key.code : '-',
    },
    {
        title: 'مدارک', dataIndex: 'uploads', key: 'uploads', // eslint-disable-next-line react/jsx-key
        render: (u) => u ? u.map((upload) => (
            <div key={upload.id}><a href={upload.file}>{upload.name}</a></div>)) : null,
    },];
    const handleTableChange = (pagination, filters, sorter) => {
        setupdatedata(!updatedata)
        setTableParams({
            pagination, filters, ...sorter,
        })
    }

    const fetchData = () => {
        setLoading(true);
        // let fdoc=doc_state ? "?get_nulls=1&" : "?get_nulls=0&" //doc_state && "?get_nulls=0&"
        console.log(
            `      ${doc_state}?page=${tableParams.pagination.current}`
        )
        api().url(`/api/logistics/${doc_state}&page=${tableParams.pagination.current}`).get().json().then((res) => {
            console.log("API Response:", res);
            let newdata = res.results.map((item) => ({ "key": item.id, ...item }))
            setData(newdata);
            setlocation(res.sub_units)
            setLoading(false);
            setTableParams({
                ...tableParams, pagination: {
                    ...tableParams.pagination, total: res.count, // 200 is mock data, you should read it from server
                    // total: data.totalCount,
                },
            });
        });
    };

    useEffect(() => {
        setTableParams({

            pagination: {
                current: 1,
            },
        });
        fetchData();
    }, [updatedata, doc_state]);


    const exportToExcel = async () => {
        try {
            message.loading({ content: 'در حال دریافت اطلاعات از سرور...', key: 'excel', duration: 0 });

            let allData = [];
            let totalRecords = 0;
            let totalPages = 1;

            // First request to get total count
            const initialResponse = await api().url(`/api/logistics/${doc_state}&page=1`).get().json();
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

                    const response = await api().url(`/api/logistics/${doc_state}&page=${page}`).get().json();
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
                "شماره سند": item.Fdoc_key?.code || '',
                "تاریخ مدرک": item.date_doc ? new Intl.DateTimeFormat('fa-IR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                }).format(new Date(item.date_doc)) : '',
                "نوع ارائه": item.type ? "کالا" : "خدمات",
                "نام کالا/خدمات": item.name || '',
                "کد ملی فروشنده": item.seller_id || '',
                "فروشگاه": item.seller || '',
                "محل هزینه": item.Location?.name || '',
                "در وجه": item.account_name || '',
                "بانک": item.bank_name || '',
                "شماره شبا": item.account_number || '',
                "مبلغ": item.price || 0,
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

    return (<>
        <Modal title="ویرایش مدارک" style={{ marginLeft: "-15%" }} centered open={isModalOpen}
            onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>


            <Logistics_Doc
                Fdata={data}
                selectedid={selectedid}
                modal={handleModalChange}
                remove={remove_item}
                location={location}
                updateLocation={updateLocationInData}
            />


        </Modal>
        <Radio.Group onChange={(e) => {
            setTableParams({
                pagination: {
                    current: 1,
                    pageSize: 10,
                },
            });
            set_doc_state(e.target.value)
        }
        } defaultValue={doc_state}>
            <Radio.Button value={"?get_nulls=true"}>بدون سند</Radio.Button>
            <Radio.Button value={"?get_nulls=false"}>با سند</Radio.Button>


        </Radio.Group>
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
        <Table columns={columns} dataSource={data} pagination={tableParams.pagination}
            loading={loading} onChange={handleTableChange} />
    </>)
};
export default App;