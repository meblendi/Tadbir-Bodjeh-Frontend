"use client";
import React, {useEffect, useState} from 'react';
import {Button, Modal, Space, Table} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {api} from "@/app/fetcher";
import Form5_doc, {form5_doc} from "@/app/budget/form5/form5";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";

export default function Program() {
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected_data, setselected_data] = useState<form5_doc>();
    const [loading, setLoading] = useState(false);
    const [tableParams, setTableParams] = useState({
        pagination: {
            current: 1, pageSize: 10, total: 10
        },
    });
    const [update, set_update] = useState(0);

    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale('fa'); // Set the locale to Persian/Farsi
    dayjs["calendar"]('jalali');
    const [form_date, set_form_date] = useState(dayjs(new Date()))

    const fetchData = () => {
        setLoading(true);
        let Year = dayjs(form_date).format("YYYY");
        api().url(`/api/budget_chapter?page=${tableParams.pagination.current}&year=${Year}`).get().json().then((res) => {
            console.log(res)
            setData(res["results"])
            setLoading(false);
            setTableParams({
                ...tableParams, pagination: {
                    ...tableParams.pagination, "total": res["count"],
                    // total: data.totalCount,
                },
            });
        });
    }
    useEffect(() => {
        fetchData();
        // console.log("useEffect");
    }, [update, JSON.stringify(tableParams), form_date]);

    const showModal = (data: form5_doc) => {
        console.log(data)
        setselected_data(data)
        setIsModalOpen(true);
    };
    const handleUpdate = () => {
        setIsModalOpen(!isModalOpen);
        set_update(update + 1)
    }
    const handleOk = () => {
        setIsModalOpen(false);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const handleTableChange = (pagination, filters, sorter) => {
        setTableParams({
            pagination,
            filters,
            ...sorter,
        })
    }

    const columns = [
        {
            title: 'سرفصل',
            dataIndex: 'name',
            key: 'name',
            render: (name, rec) => <a
                onClick={() => showModal({
                    type: 0,
                    id: rec.id,
                    name: rec.name,
                    title: 'سرفصل',
                    code: rec.code,
                    year: rec.year,
                    fin_code: rec.fin_code
                })}>{name}</a>,
        },
        {
            title: 'فصل',
            dataIndex: 'budget_section',
            key: 'budget_section',
            render: (budget_section) => (
                <ul>
                    {
                        budget_section.map((item) => (
                            <li key={item.id}>
                                <a onClick={() => showModal({
                                    type: 1,
                                    id: item.id,
                                    name: item.name,
                                    title: 'موضوع',
                                    code: item.code
                                    , year: item.year,
                                    budget_chapter: item.budget_chapter,
                                    fin_code: item.fin_code


                                })}>{item.name}</a>
                            </li>
                        ))
                    }
                </ul>
            ),
        },
        {
            title: 'ردیف',
            dataIndex: 'budget_section',
            key: 'budget_section',
            render: (budget_section) => (
                <ul>
                    {
                        budget_section.map((item) => (
                            item.budget_row.map(
                                (row) => (
                                    <li key={row.id}>
                                        <a onClick={() => showModal({
                                            type: 2,
                                            id: row.id,
                                            name: row.name,
                                            title: 'ردیف',
                                            code: row.code
                                            , year: row.year,
                                            budget_section: row.budget_section,
                                            fin_code: row.fin_code
                                        })}>{row.name}</a>
                                    </li>
                                )
                            )

                        ))
                    }
                </ul>
            ),
        }

    ];
    return (
        <div>
            <div className={"py-2"}>
                <span className={"h1"}> فرم پنج</span>


                <span className={"float-end"}>
                 <span className={"h2"}>  انتخاب سال </span>

                    <DatePickerJalali

                        picker="year"
                        // defaultValue={"1403"}
                        defaultValue={form_date}
                        onChange={e => {
                            set_form_date(e)
                        }
                        }
                    />

                </span>


            </div>


            <Space>
                <Button type="primary" size="middle" icon={<PlusOutlined/>}

                        onClick={
                            () => showModal({
                                name: "",
                                type: 0, id: null, title: "سرفصل"
                            })
                        }
                >
                    ایجاد سرفصل
                </Button>
                <Button type="primary" size="middle" icon={<PlusOutlined/>}

                        onClick={
                            () => showModal({
                                name: "",
                                type: 1, id: null, title: "فصل"
                            })
                        }
                >
                    ایجاد فصل
                </Button>
                <Button type="primary" size="middle" icon={<PlusOutlined/>}

                        onClick={
                            () => showModal({
                                name: "",
                                type: 2, id: null, title: "ردیف"
                            })
                        }
                >
                    ایجاد ردیف
                </Button>                
            </Space>
            <Modal title={selected_data?.title} style={{marginLeft: "-15%"}} centered open={isModalOpen}
                   onOk={handleOk} onCancel={handleCancel} footer={null} zIndex={100} width={"75%"}>
                <Form5_doc data={selected_data} key={JSON.stringify(selected_data)} onOk={handleUpdate}
                           onCancel={handleCancel}/>

            </Modal>
            <Table columns={columns} dataSource={data} rowKey="id" pagination={tableParams.pagination} loading={loading}

                   onChange={handleTableChange}/>

        </div>
    );
}