"use client";
import React, {useEffect, useState} from 'react';
import {Button, Modal, Space, Table} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import Programform from "@/app/budget/program/program";

export type ProgramData = {
    id?: number;
    name?: string;
    title?: string;
    code?: string;
    year?: number;
    fin_code?: string;
    general_cost?: number;
    specific_cost?: number;
    other_cost?: number;
    total_cost?: number;
};
export default function Program() {
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected_data, setselected_data] = useState<ProgramData>();
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
        api().url(`/api/program?page=${tableParams.pagination.current}&year=${Year}`).get().json().then((res) => {
            console.log(res)
            const dataWithIndex = res["results"].map((item, index) => ({
            ...item,
            index: (tableParams.pagination.current - 1) * tableParams.pagination.pageSize + index + 1
        }));
            setData(dataWithIndex)
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
    const showModal = (data: ProgramData) => {
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
        {title: "ردیف", dataIndex: "index", key: "index", },
        {
            title: 'نام برنامه',
            dataIndex: 'name',
            key: 'name',
            render: (name, rec) => <a
                onClick={() => showModal({
                        id: rec.id,
                        name: rec.name,
                        title: 'برنامه',
                        code: rec.code,
                        year: rec.year,
                        fin_code: rec.fin_code,
                        general_cost: rec.general_cost,
                        specific_cost: rec.specific_cost,
                        other_cost: rec.other_cost,
                        total_cost: rec.general_cost + rec.specific_cost + rec.other_cost
                    }
                )}>{name}</a>,
        },
        {
            title: 'سال',
            dataIndex: 'year',
            key: 'year',
        },
        {
            title: 'کد برنامه',
            dataIndex: 'code',
            key: 'code',
        },
        {
            title: 'کد مالی',
            dataIndex: 'fin_code',
            key: 'fin_code',
        },
        {
            title: 'هزینه اختصاصی',
            dataIndex: 'general_cost',
            key: 'general_cost'

        },
        {
            title: 'هزینه عمومی',
            dataIndex: 'specific_cost',
            key: 'specific_cost'
        },
        {
            title: 'هزینه متفرقه',
            dataIndex: 'other_cost',
            key: 'other_cost'
        },
        {
            title: 'جمع'
            , dataIndex: 'total_cost', key: 'total_cost'
            , render: (_, rec) => <span>{rec.general_cost + rec.specific_cost + rec.other_cost}</span>

        }

    ]

    return (
        <div>
            <div className={"py-2"}>
                <span className={"h1"}>برنامه‌ها</span>
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
                                title: "ایجاد برنامه", id: null

                            })
                        }
                >
                    ایجاد برنامه
                </Button>
            </Space>
            <Modal title={selected_data?.title} style={{marginLeft: "-15%"}} centered open={isModalOpen}
                   onOk={handleOk} onCancel={handleCancel} footer={null} zIndex={100} width={"75%"}>
                <Programform data={selected_data} key={JSON.stringify(selected_data)} onOk={handleUpdate}
                             onCancel={handleCancel}/>
            </Modal>
            <Table
                columns={columns}
                dataSource={data}
                loading={loading}
                onChange={handleTableChange}
                pagination={tableParams.pagination}
            />

        </div>
    );
}