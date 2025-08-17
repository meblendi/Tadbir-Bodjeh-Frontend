"use client";
import {api} from "@/app/fetcher";
import Logistics_Doc from "@/app/Logistics/Docs/page";
import {numberWithCommas} from "@/app/Logistics/Print/page";
import {ConfigProvider, Modal, Table} from "antd";
import fa_IR from "antd/lib/locale/fa_IR";
import React, {useEffect, useState} from "react";
import "@/styles/table.css";

export async function async_FetchLogisticsData(id) {
    let nextURL = `/api/logistics/?Fdoc_key=${id}`;
    let url = false
    let newdata = {}
    while (nextURL) {
        const res = await api().url(nextURL, url).get().json();

        if (res.next !== null) {
            url = true
        }
        nextURL = res.next;

        if (newdata.results) {
            newdata.results.push(...res.results);
        } else {
            newdata = res
        }

    }
    // console.log(newdata)
    return newdata
}

// print function that show financial report that include table of logistic document with header and footer
export default function Fin_detail(props) {

    let id = props.record ? props.record.id : 41;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [updatedata, setupdatedata] = useState(false);
    const [data, setData] = useState([]);
    const [location, setlocation] = useState([]);
    const [selectedid, setselectedid] = useState(0);
    const [loading, setLoading] = useState(false);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1, pageSize: 10,
        },
    });

    console.log(props)
    const handleModalChange = (newState) => {

        setIsModalOpen(newState);
        console.log(newState)
        // console.log(typeof props.change_data)
        // console.log(props.change_data)
        props.change_data(props.record.id)
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
    const remove_item = (id) => {
        setData(
            data.filter((item) => item.id !== id)
        )
    }
    const columns = [{
        title: 'شماره',
        dataIndex: 'id',
        key: 'id',
    }, {

        title: 'نام کالا/خدمات\n', dataIndex: 'name', key: 'name', render: (text, record) => {
            // setselectedid(record.id)
            return <>
                <a onClick={() => showModal(record)}>{text}</a>
            </>
        }
    }, {
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
    }, {
        title: 'کد ملی/ شناسه\n', dataIndex: 'seller_id', key: 'seller_id',
    }, {
        title: 'ارائه دهنده', dataIndex: 'seller', key: 'seller',
    }, , {
        title: 'قیمت', dataIndex: 'price', key: 'price',
        sorter: (a, b) => a.price - b.price,
        render: (price) => numberWithCommas(price.toLocaleString('fa-IR')),
    }, , {
        title: 'تاریخ', dataIndex: 'date_doc', key: 'date_doc', render: (date) => {
            return new Intl.DateTimeFormat('fa-IR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(new Date(date));
        }
    },

        // {
        //     title: 'سازنده',
        //     dataIndex: 'user',
        //     key: 'user',
        //     // eslint-disable-next-line react/jsx-key
        // },
        // {
        //     title: 'سند',
        //     dataIndex: 'Fdoc_key',
        //     key: 'Fdoc_key',
        //     // eslint-disable-next-line react/jsx-key
        // },
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

        async_FetchLogisticsData(id).then(res => {
            console.log(res)
            let newdata = res.results.map((item) => ({"key": item.id, ...item}))
            setData(newdata);
            setlocation(res.sub_units)
            setLoading(false);
            // setTableParams({
            //     ...tableParams, pagination: {
            //         ...tableParams.pagination, total: res.count, // 200 is mock data, you should read it from server
            //         // total: data.totalCount,
            //     },
            // });
        });

        // api().url(`/api/logistics/?page=${tableParams.pagination.current}`).get().json().then((res) => {
        //     console.log(res);
        //     let newdata = res.results.map((item) => ({"key": item.id, ...item}))
        //     setData(newdata);
        //     setlocation(res.sub_units)

        // });

    };
    useEffect(() => {
        fetchData();
    }, [updatedata]);

    return (<>
        <Modal title="ویرایش مدارک" style={{marginLeft: "-15%"}} centered open={isModalOpen}
               onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>


            <Logistics_Doc Fdata={data} selectedid={selectedid} modal={handleModalChange} remove={remove_item}
                           location={location} fin_state={props.record.fin_state} update_fin={props.Fdata}/>

        </Modal>
        <ConfigProvider locale={fa_IR} direction="rtl" theme={{
            token: {
                fontFamily: "Yekan",
                Table: {
                    // cellFontSize: 9,
                    padding: "2px",

                    borderColor: "#b1b1b1",
                    borderBottomWidth: "10px !important",
                    // align:"center",
                    headerBorderRadius: "4px",
                    borderBottom: "2px dotted #b1b1b1 !important", // Add this line to set the bottom border

                    /* here is your component tokens */
                }

            }
        }}>
            <Table columns={columns} dataSource={data} bordered className={"detail-table"}
                   loading={loading} onChange={handleTableChange} pagination={false}/>
        </ConfigProvider>
    </>)
}