"use client";

import {api} from "@/app/fetcher";
import {Modal, Radio, Table} from "antd";
import React, {useEffect, useState} from "react";
import Tankhah from "@/app/Logistics/Tankhah/sabt/page";
import Cookies from "js-cookie";

export default function List() {
    const [data, setData] = useState();
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedid, setselectedid] = useState(0);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1,
            pageSize: 10,
        },
    });

    function fetchData() {
        const request = api().url(`/api/pettycash/`).get().json();
        request.then((res: any) => {
            // console.log(res)
            let newdata = res.results.map(
                (item) => ({"key": item.id, ...item})
            )
            setData(newdata);
            setLoading(false);
        });


    }

    const onchangeLog = (e, record) => {
        api().url(`/api/pettycash/${record.id}/`).patch({
            "L_conf": e.target.value
        }).json().then((res) => {
            console.log(res);
            fetchData();
        })
    }
    const onchangeFin = (e, record) => {
        api().url(`/api/pettycash/${record.id}/`).patch({
            "F_conf": e.target.value
        }).json().then((res) => {
            console.log(res);
            fetchData();
        })
    }
    const showModal = (value) => {
        // console.log(  ...data.filter((item) => item.id === value.id).flat())
        // console.log(value.id)
        setselectedid(value.id)
        setIsModalOpen(true);
    };
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleModalChange = (newState) => {
        setIsModalOpen(newState);
    };
    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            ...sorter,
        })
    }
    useEffect(() => {
        fetchData()
    }, [JSON.stringify(tableParams)]);
    const columns = [
        {
            title: 'نام سند',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) =>
                <a onClick={() => showModal(record)}>{text}</a>

        },
        {
            title: 'شماره سند',
            dataIndex: 'doc_num',
            key: 'id',
        },
        {
            title: 'مبلغ',
            dataIndex: 'price',
            key: 'price',
        },
        {
            title: 'تاریخ',
            dataIndex: 'date_doc',
            key: 'date_doc',
            render: (date) => {
                let today = new Date(date);
                let dateq = new Intl.DateTimeFormat('fa-IR').format(today);
                return dateq
            }
        },
        {
            title: 'توضیحات',
            dataIndex: 'descr',
            key: 'descr',
        },

        {
            title: 'کارپرداز',
            dataIndex: 'forwhom',
            key: 'forwhom',
            // eslint-disable-next-line react/jsx-key
            render: (item) => {

                return item ? item.name : ""

            },
        },

        {
            title: 'تایید امور مالی',
            dataIndex: 'F_conf',
            key: 'F_conf',
            // eslint-disable-next-line react/jsx-key
            render: (bool, record) => {
                let x: React.JSX.Element | string = bool !== null ? (bool ? "تایید" : "تایید نشده") : "بررسی نشده";
                if (Cookies.get("group").startsWith("financial")) {
                    //change row background color to green

                    x = <Radio.Group defaultValue={bool} disabled={bool} onChange={(e) => onchangeFin(e, record)}>
                        <Radio.Button value={true}>تایید</Radio.Button>
                        <Radio.Button value={false}>رد</Radio.Button>
                    </Radio.Group>
                }
                return bool !== null ? (bool ? "تایید" : x) : x;


            },
        },
        {
            title: 'تایید کارپرداز',
            dataIndex: 'L_conf',
            key: 'L_conf',
            // eslint-disable-next-line react/jsx-key
            render: (bool, record) => {
                let x: React.JSX.Element | string = bool !== null ? (bool ? "تایید" : "تایید نشده") : "بررسی نشده";

                // console.log(item)
                if (Cookies.get("group").startsWith("logistics")) {
                    if (Cookies.get())

                        x = <Radio.Group defaultValue={bool} disabled={bool}
                                         onChange={(e) => onchangeLog(e, record)}>
                            <Radio.Button value={true}>تایید</Radio.Button>
                            <Radio.Button value={false}>رد</Radio.Button>
                        </Radio.Group>
                }
                return bool !== null ? (bool ? "تایید" : x) : x;
            },
        },

    ]
    const rowClassName = (record) => {
        return Cookies.get("group").startsWith("financial") && record.F_conf === null ? 'green-row' : Cookies.get("group").startsWith("logistics") && record.L_conf === null ? 'green-row' : '';
    }
    return (

        <>
            <Modal title="ویرایش تنخواه" style={{marginLeft: "-15%"}} centered open={isModalOpen}
                   onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>
                <Tankhah Fdata={data} selectedid={selectedid} modal={handleModalChange}/>
            </Modal>
            <Table columns={columns} dataSource={data} loading={loading} pagination={tableParams.pagination}
                   onChange={handleTableChange} rowClassName={rowClassName}/>
        </>

    )
}