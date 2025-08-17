"use client";
import React, {useEffect, useState} from 'react';
import {Button, Modal, Space, Table} from "antd";
import {PlusOutlined} from "@ant-design/icons";
import {api} from "@/app/fetcher";
import {DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener} from "@realmodule/antd-jalali";
import dayjs from "dayjs";
import Relation from "@/app/budget/relation/relation";

export type IdNamePair = {
    id: number;
    name: string;
};
export type RelationData = {
    id?: number;
    title?: string;
    budget_row?: IdNamePair;
    cost_type?: string;
    year?: string;
    programs?: IdNamePair[];
    organization?: IdNamePair[];
}
export default function Page() {
    const [data, setData] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selected_data, setselected_data] = useState<RelationData>();
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
        api().url(`/api/relation?page=${tableParams.pagination.current}&year=${Year}`).get().json().then((res) => {
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
    const showModal = (data: RelationData) => {
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
            title: 'ردیف ',
            dataIndex: 'budget_row',
            key: 'budget_row',
            render: (budget_row, rec) => <a
                onClick={() => showModal({
                        id: rec.id,
                        title: 'روابط',
                        budget_row: rec.budget_row,
                        year: rec.year,
                        programs: rec.programs,
                        cost_type: rec.cost_type,
                        organization: rec.organization
                    }
                )}>{budget_row?.name || 'No budget row'}</a>,
        },
        {
            title: 'سال',
            dataIndex: 'year',
            key: 'year',
        },
        {
            title: 'برنامه',
            dataIndex: 'programs',
            key: 'programs',
            render: (programs) => {
                return programs.map((p) => <div key={p.id}>{p.name}</div>)
            }
        },
        
        {
            title: 'مرکز هزینه',
            dataIndex:
                'organization',
            key:
                'organization',
            render: (organization) => {

                return organization.map((p) => <div key={p.id}>{p.name}</div>)


            }
        }
        ,

    ]
    return (
        <div>
            <div className={"py-2"}>
                <span className={"h1"}>روابط</span>
                <span className={"float-end"}>
                 <span className={"h2"}>انتخاب سال</span>
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
                                title: "ایجاد رابطه", id: null
                            })
                        }
                >
                    ایجاد رابطه
                </Button>
            </Space>
            <Modal title={selected_data?.title} style={{marginLeft: "-15%"}} centered open={isModalOpen}
                   onOk={handleOk} onCancel={handleCancel} footer={null} zIndex={100} width={"75%"}>
                <Relation data={selected_data} key={JSON.stringify(selected_data)} onOk={handleUpdate}
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