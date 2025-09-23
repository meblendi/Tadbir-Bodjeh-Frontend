"use client";
import { api } from "@/app/fetcher";
import Logistics_Doc from "@/app/Logistics/Docs/page";
import { numberWithCommas } from "@/app/Logistics/Print/page";
import { ConfigProvider, Modal, Table, Form, message, Select } from "antd";
import { EditOutlined, CheckOutlined, CloseOutlined, CalculatorOutlined } from '@ant-design/icons';
import fa_IR from "antd/lib/locale/fa_IR";
import React, { useEffect, useState } from "react";
import "@/styles/table.css";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import dayjs from "dayjs";

function toPersianNumbers(str) {
    if (str == null) {
        // Handle null or undefined values
        return "";
    }

    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return str.toString().replace(/[0-9]/g, function (w) {
        return persianNumbers[+w];
    });
}
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
    const [relation, set_relation] = useState([])
    const [selected_relation, set_selected_relation] = useState(0)
    const [selected_location, set_selected_location] = useState([]);
    const [selected_organization, set_selected_organization] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();
    const [budgetRow, setbudgetRow] = useState([]);
    const form_date = props.form_date || dayjs(new Date());
    useJalaliLocaleListener();
    dayjs.extend(jalaliPlugin);
    dayjs.locale("fa"); // Set the locale to Persian/Farsi
    dayjs["calendar"]("jalali");

    useEffect(() => {
        let Year = form_date.format("YYYY");
        api().url("/api/budget_row?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
            setbudgetRow(r);
        });
    }, [form_date]);

    useEffect(() => {

        if (props.Fdata) {
            props.Fdata.filter((item) => {

                if (item.id === prop.selectedid) {
                    set_Fdoc_key(item.Fdoc_key)
                    console.log(item)
                    set_id(item.id)
                    var x = item.uploads.map((file) => {
                        return {
                            uid: file,
                            name: file.name,
                            status: 'done',
                            url: file.file,
                            response: {
                                id: file.id,
                                file: file.file
                            }
                        }
                    })
                    set_selected_relation(item.budget_row.id)
                    form.setFieldsValue({
                        Location: item.Location == null ? "" : item.Location.id,
                        budget_row: item.budget_row.id,
                        program: item.program.id,
                        cost_type: item.cost_type,
                    })
                    item.Location !== null ? set_selected_location(item.Location.id) && set_selected_organization(location.find(item => item.id === selected_location).organization_id) : ""

                    let Year = dayjs(item.date_doc).format("YYYY");
                    api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
                        // console.log(r)
                        setlocation(r)
                    })
                }
            })
        }
    }, [props.Fdata, props.selectedid]);

    function loadRelation() {
        if (selected_organization !== null) {
            console.log(selected_organization)
            api().url("/api/relation?no_pagination=true&organization=" + selected_organization).get().json().then(r => {
                set_relation(r);
                console.log(r)
            })
        }
    }
    useEffect(() => {
        loadRelation()
    }, [selected_organization])

    console.log(props)
    const handleModalChange = (newState) => {

        setIsModalOpen(newState);
        console.log(newState)
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

    const [editingKey, setEditingKey] = useState('');
    const [form] = Form.useForm();

    const isEditing = (record) => record.key === editingKey;

    const edit = async (record) => {
        // Load relation data based on the record's Location organization
        if (record.Location?.organization_id) {
            try {
                const response = await api()
                    .url(`/api/relation?no_pagination=true&organization=${record.Location.organization_id}`)
                    .get()
                    .json();
                set_relation(response);
            } catch (error) {
                console.error('Error loading relation data:', error);
            }
        }

        form.setFieldsValue({
            Location: record.Location?.id,
            budget_row: record.budget_row?.id,
            program: record.program?.id,
            cost_type: record.cost_type,
            ...record,
        });
        setEditingKey(record.key);
    };

    const cancel = () => {
        setEditingKey('');
    };

    const save = async (key) => {
        try {
            const row = await form.validateFields();
            const newData = [...data];
            const index = newData.findIndex((item) => key === item.key);

            if (index > -1) {
                const item = newData[index];
                newData.splice(index, 1, { ...item, ...row });
                setData(newData);
                setEditingKey('');

                // Update the record in the database
                await api().url(`/api/logistics/${key}/`).put(row).json();
                messageApi.success('تغییرات با موفقیت ذخیره شد');

                // Trigger table reload
                setupdatedata(prev => !prev);
            } else {
                newData.push(row);
                setData(newData);
                setEditingKey('');
            }
        } catch (errInfo) {
            console.log('Validate Failed:', errInfo);
        }
    };


    useEffect(() => {
        if (props.record?.Location?.organization_id) {
            api().url("/api/relation?no_pagination=true&organization=" + props.record.Location.organization_id)
                .get()
                .json()
                .then(r => {
                    set_relation(r);
                });
        }
    }, [props.record?.Location?.organization_id]);

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const [programsWithCosts, setProgramsWithCosts] = useState({});

    // Add this useEffect to fetch program costs
    useEffect(() => {
        const fetchProgramCosts = async () => {
            if (relation.length > 0) {
                const allProgramIds = relation.flatMap(item =>
                    item.programs.map(program => program.id)
                );

                try {
                    const programCosts = {};
                    for (const programId of allProgramIds) {
                        const response = await api().url(`/api/program/${programId}/`).get().json();
                        programCosts[programId] = response;
                    }
                    setProgramsWithCosts(programCosts);
                } catch (error) {
                    console.error('Error fetching program costs:', error);
                }
            }
        };

        fetchProgramCosts();
    }, [relation]);

    const columns = [

        {
            title: 'شماره',
            dataIndex: 'id',
            key: 'id',
        },

        {

            title: 'نام کالا/خدمات\n', dataIndex: 'name', key: 'name',
            render: (text, record) => {
                // setselectedid(record.id)
                return <>
                    <a onClick={() => showModal(record)}>{toPersianNumbers(text)}</a>
                </>
            }
        },
        {
            title: 'قیمت', dataIndex: 'price', key: 'price',
            sorter: (a, b) => a.price - b.price,
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
            title: 'محل هزینه',
            dataIndex: 'Location',
            key: 'Location',
            render: (location) => location ? location.name : '-'
        },
        {
            title: 'جمع هزینه',
            dataIndex: 'sum',
            key: 'sum',
            render: (_, record) => {
                if (record.Location) {
                    const similarItems = data.filter(item =>
                        item.Location && item.Location.id === record.Location.id
                    );
                    const similarItemsPriceSum = similarItems.reduce(
                        (sum, item) => sum + (item.price || 0), 0
                    );

                    return (
                        <span>
                            <a onClick={() => {
                                messageApi.info(`جمع ${toPersianNumbers(similarItems.length)} آیتم: ${numberWithCommas(similarItemsPriceSum)}`);
                            }}>
                                {numberWithCommas(similarItemsPriceSum.toLocaleString('fa-IR'))}
                            </a>
                        </span>
                    );
                }
                return '-';
            },
        },
        {
            title: 'ردیف هزینه',
            dataIndex: 'budget_row',
            key: 'budget_row',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <Form.Item
                        name="budget_row"
                        style={{ margin: 0 }}

                    >
                        <Select
                            style={{ width: '100%' }}
                            showSearch
                            filterOption={filterOption}
                            placeholder="انتخاب ردیف هزینه"
                            onChange={
                                value => {
                                    set_selected_relation(value)
                                    form.setFieldsValue({
                                        program: undefined
                                    });
                                }
                            }
                            options={budgetRow.map((item) => ({
                                label: `${item.fin_code} - ${item.name}`,
                                value: item.id,
                            }))}
                        />
                    </Form.Item>
                ) : (
                    record.budget_row ? record.budget_row.name : '-'
                );
            },
        },
        {
            title: 'برنامه',
            dataIndex: 'program',
            key: 'program',
            render: (_, record) => {
                const editable = isEditing(record);
                const budgetRowId = form.getFieldValue('budget_row');

                return editable ? (
                    <Form.Item
                        name="program"
                        style={{ margin: 0 }}
                    >
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder="انتخاب برنامه"
                            options={
                                relation
                                    .filter(item => item.budget_row && item.budget_row.id === selected_relation)
                                    .flatMap(item =>
                                        item.programs.map(program => {
                                            const programWithCost = programsWithCosts[program.id] || program;

                                            const general_cost = programWithCost.general_cost || 0;
                                            const specific_cost = programWithCost.specific_cost || 0;
                                            const other_cost = programWithCost.other_cost || 0;
                                            const total_price = programWithCost.total_price || 0;

                                            const totalCost = general_cost + specific_cost + other_cost;
                                            const remaining = (totalCost / 100) - total_price;

                                            return {
                                                label: `${program.name} - باقیمانده: ${toPersianNumbers(numberWithCommas(remaining))}`,
                                                value: program.id
                                            };
                                        })
                                    )
                            }
                        />
                    </Form.Item>
                ) : (
                    record.program ? record.program.name : '-'
                );
            },
        },
        {
            title: 'نوع هزینه',
            dataIndex: 'cost_type',
            key: 'cost_type',
            render: (_, record) => {
                const editable = isEditing(record);
                const types = {
                    0: "عمومی",
                    1: "اختصاصی",
                    2: "متفرقه و ابلاغی",
                    3: "تعمیر و تجهیز",
                    4: "تامین فضا"
                };

                return editable ? (
                    <Form.Item
                        name="cost_type"
                        style={{ margin: 0 }}
                    >
                        <Select
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }

                            options={[
                                { label: "عمومی", value: 0 },
                                { label: "اختصاصی", value: 1 },
                                { label: "متفرقه و ابلاغی", value: 2 },
                                { label: "تعمیر و تجهیز", value: 3 },
                                { label: "تامین فضا", value: 4 }
                            ]}
                        />
                    </Form.Item>
                ) : (
                    types[record.cost_type] || '-'
                );
            },
        },
        ...(props.record.fin_state === 1 ? [{
            title: 'عملیات',
            dataIndex: 'operation',
            render: (_, record) => {
                const editable = isEditing(record);
                return editable ? (
                    <span>
                        <a onClick={() => save(record.key)} style={{ marginLeft: 13, color: '#1890ff' }}>
                            <CheckOutlined />
                        </a>
                        <a onClick={cancel} style={{ color: '#ff4d4f' }}>
                            <CloseOutlined />
                        </a>
                    </span>
                ) : (
                    <a onClick={() => edit(record)}><EditOutlined /></a>
                );
            },
        }] : []),
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
            let newdata = res.results.map((item) => ({ "key": item.id, ...item }))
            setData(newdata);
            setlocation(res.sub_units)
            setLoading(false);
        });

    };
    useEffect(() => {
        fetchData();
    }, [updatedata]);

    const EditableCell = ({
        editing,
        dataIndex,
        title,
        inputType,
        record,
        index,
        children,
        ...restProps
    }) => {
        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{
                            margin: 0,
                        }}
                        rules={[
                            {
                                required: true,
                                message: `لطفا ${title} را وارد کنید!`,
                            },
                        ]}
                    >
                        {children}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };

    return (<>
        {contextHolder}
        <Modal title="ویرایش مدارک" style={{ marginLeft: "-15%" }} centered open={isModalOpen}
            onOk={handleOk} width={"75%"} onCancel={handleCancel} footer={null} zIndex={100}>


            <Logistics_Doc Fdata={data} selectedid={selectedid} modal={handleModalChange} remove={remove_item}
                location={location} fin_state={props.record.fin_state} update_fin={props.Fdata} />

        </Modal>
        <Form form={form} component={false}>
            <ConfigProvider locale={fa_IR} direction="rtl" theme={{
                token: {
                    fontFamily: "Yekan",
                    Table: {
                        padding: "2px",
                        borderColor: "#b1b1b1",
                        borderBottomWidth: "10px !important",
                        headerBorderRadius: "4px",
                        borderBottom: "2px dotted #b1b1b1 !important",
                    }
                }
            }}>
                <Table components={{
                    body: { cell: EditableCell, },
                }} columns={columns} dataSource={data} bordered className={"detail-table"}
                    loading={loading} onChange={handleTableChange} pagination={false} />
            </ConfigProvider>
        </Form>
    </>)
}