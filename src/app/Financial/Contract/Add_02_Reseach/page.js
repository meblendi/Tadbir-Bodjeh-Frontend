"use client";
import { AuthActions } from "@/app/auth/utils";
import { api } from "@/app/fetcher";
import Contract_print from "@/app/Financial/Contract/Print/page";
import { url } from "@/app/Server";
import { PrinterOutlined, UploadOutlined } from "@ant-design/icons";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener } from "@realmodule/antd-jalali";
import { Button, Col, Form, Input, InputNumber, message, Popconfirm, Radio, Row, Select, Table, Upload, Popover } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState } from "react";
import ReactToPrint from "react-to-print";

export function numberWithCommas(x) {

    return x !== null ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0
}

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



const Research_Doc = (prop) => {
    const [form] = Form.useForm()
    const [fileList, setFileList] = useState([])
    const [Fdoc_key, set_Fdoc_key] = useState(null)
    const { handleJWTRefresh, storeToken, getToken } = AuthActions();
    const [location, setlocation] = useState([]);
    const [selected_location, set_selected_location] = useState([]);
    const [selected_organization, set_selected_organization] = useState([]);
    const [id, set_id] = useState(0)
    // const is_fin = Cookies.get("group") == "financial"
    const [budgetRow, setbudgetRow] = useState([]);
    const [relation, set_relation] = useState([])
    const [selected_relation, set_selected_relation] = useState(0)
    const [list_contract_types, set_list_contract_types] = useState([])
    const [Contractor_level, set_Contractor_level] = useState("b") // Set Default Contractor_level for this page
    const [Contract_record, set_Contract_record] = useState([]);
    const [printRefs, setPrintRefs] = useState({});
    useJalaliLocaleListener();
    dayjs.calendar('jalali');
    dayjs.extend(jalaliPlugin);
    const [form_date, set_form_date] = useState(dayjs(new Date(), { jalali: true }))
    useEffect(() => { }, []);
    const handleAdd = () => {
        const newData = {
            key: Contract_record.length + 1,
            descr: "",
            requested_performance_amount: 0,
            treasury_deduction_percent: 0,
            overhead_percentage: 0,
            performanceـwithholding: 0,
            performanceـwithholding_percentage: 0,
            payable_amount_after_deductions: 0,
            tax_percentage: 0,
            tax_amount: 0,
            final_payable_amount: 0,
            insurance: 0,
            advance_payment_deductions: 0,
            vat: 0,
            mode: "new",
        };
        set_Contract_record([...Contract_record, newData]);
    };
    const handleDelete = (key) => {
        const newData = Contract_record.filter((item) => {
            console.log(item.key === key)
            console.log(item.mode !== "new")
            if (item.key === key && item.mode !== "new") {

                item.mode = "delete";

                return true
            }

            return item.key !== key;
        });
        console.log(newData)
        set_Contract_record(newData);
    };

    const calculateFinalPayableAmount = (record) => {
        const {
            requested_performance_amount,
            treasury_deduction_percent,
            overhead_percentage,
            performanceـwithholding,
            performanceـwithholding_percentage,
            payable_amount_after_deductions,
            tax_percentage,
            tax_amount,
            insurance,
            advance_payment_deductions,
            vat
        } = record;
        const treasuryDeduction = (requested_performance_amount * treasury_deduction_percent) / 100;
        const overheadDeduction = (treasuryDeduction * overhead_percentage) / 100;

        let performanceWithholding = performanceـwithholding || 0;
        if (performanceـwithholding_percentage) {
            performanceWithholding = (requested_performance_amount * performanceـwithholding_percentage) / 100;
        }
        let taxDeduction = tax_amount || 0;
        if (tax_percentage) {
            taxDeduction = (overheadDeduction * tax_percentage) / 100;
        }
        let totalDeductions = 0
        if (Contractor_level === "d") {
            totalDeductions = taxDeduction
        }
        if (Contractor_level === "c") {

            totalDeductions = treasuryDeduction +
                overheadDeduction +
                performanceWithholding +
                taxDeduction +
                (insurance || 0) +
                (advance_payment_deductions || 0) +
                (vat || 0);
        }
        if (Contractor_level === "a") {
            totalDeductions = treasuryDeduction +
                overheadDeduction +
                performanceWithholding +
                taxDeduction
        }

        // return Math.max(requested_performance_amount - totalDeductions, 0);
        return requested_performance_amount - totalDeductions
    };

    useEffect(() => {
        console.log('Contractor Level:', Contractor_level);  // Log Contractor Level for debugging

        // Recalculate all items when Contractor_level changes
        const updatedDataSource = Contract_record.map(item => {
            const updatedItem = recalculateItem(item, Contractor_level);
            console.log('Updated Item:', updatedItem);  // Log the updated item for debugging
            return updatedItem;
        });

        // Set the updated records to the state
        set_Contract_record(updatedDataSource);
        load_contract_types();

    }, [Contractor_level]); // Re-run when Contractor_level changes


    const recalculateItem = (item, level) => {
        const newItem = { ...item };
        if (newItem.requested_performance_amount !== 0) {
            if (level === "b") {
                // Step 1: Calculate Treasury Deduction
                const treasuryDeduction = (newItem.requested_performance_amount * newItem.treasury_deduction_percent) / 100;

                // Step 2: Calculate Overhead Deduction based on Remaining Amount After Treasury Deduction
                const remainingAmount = newItem.requested_performance_amount - treasuryDeduction;
                const overheadDeduction = (remainingAmount * newItem.overhead_percentage) / 100;

                // Step 3: Calculate Total Deduction Amount
                const totalDeduction = treasuryDeduction + overheadDeduction;

                // Step 4: Calculate Payable Amount After Deductions (before tax)
                const payableAmount = newItem.requested_performance_amount - totalDeduction;
                newItem.payable_amount_after_deductions = Number(payableAmount.toFixed(2));

                // Step 5: Apply Tax Deduction
                const taxAmount = (newItem.payable_amount_after_deductions * newItem.tax_percentage) / 100;
                newItem.tax_amount = Number(taxAmount.toFixed(2));

                // Step 6: Calculate Final Payable Amount After Tax and Advance Payment Deductions
                newItem.final_payable_amount = Number(
                    (newItem.payable_amount_after_deductions - newItem.tax_amount - newItem.advance_payment_deductions - newItem.insurance + newItem.vat).toFixed(2)
                );
            } else {
                // For other levels (like "a" or "c")
                newItem.performanceـwithholding = Number((newItem.requested_performance_amount * newItem.performanceـwithholding_percentage) / 100);
                newItem.tax_amount = Number((newItem.requested_performance_amount * newItem.tax_percentage) / 100);
                newItem.final_payable_amount = Number(
                    (newItem.requested_performance_amount -
                        newItem.performanceـwithholding -
                        newItem.tax_amount -
                        newItem.advance_payment_deductions - newItem.insurance + newItem.vat).toFixed(2)
                );
            }
        }
        return newItem;
    };



    const handleInputChange = (value, record, dataIndex) => {


        const newData = Contract_record.map(item => {
            if (item.key === record.key) {
                if (item.mode === "new") {
                    return item;
                } else {
                    return { ...item, mode: "edit" };
                }
            }
            return item;
        });
        const index = newData.findIndex((item) => record.key === item.key);
        if (index > -1) {
            const item = { ...newData[index], [dataIndex]: value };
            // Handle string input for 'descr'
            if (dataIndex === 'descr') {
                item.descr = value;

            } else if (item.requested_performance_amount !== 0) {
                // Update related fields for numeric inputs
                switch (dataIndex) {
                    case 'performanceـwithholding':
                        item.performanceـwithholding_percentage = Number(((value / item.requested_performance_amount) * 100).toFixed(4));
                        break;
                    case 'performanceـwithholding_percentage':
                        item.performanceـwithholding = Number((item.requested_performance_amount * value / 100).toFixed(2));
                        break;
                    case 'tax_amount':
                        item.tax_percentage = Contractor_level === "b"
                            ? Number(((value / item.payable_amount_after_deductions) * 100).toFixed(4))
                            : Number(((value / item.requested_performance_amount) * 100).toFixed(4));
                        break;
                    case 'tax_percentage':
                        item.tax_amount = Contractor_level === "b"
                            ? Number((item.payable_amount_after_deductions * value / 100).toFixed(2))
                            : Number((item.requested_performance_amount * value / 100).toFixed(2));
                        break;
                }
            } else {
                // Reset related fields if requested_performance_amount is 0
                item.performanceـwithholding_percentage = 0;
                item.performanceـwithholding = 0;
                item.tax_percentage = 0;
                item.tax_amount = 0;
            }
            // console.log( item.descr)
            item.updated = new Date()
            // Recalculate the item
            const recalculatedItem = recalculateItem(item, Contractor_level);
            // console.log(recalculatedItem)
            newData.splice(index, 1, recalculatedItem);
            set_Contract_record(newData);
        }
    };

    useEffect(() => {

        if (prop.Fdata && Array.isArray(prop.Fdata)) {
            prop.Fdata.filter((item) => {

                if (item.id === prop.selectedid) {
                    set_Fdoc_key(item.Fdoc_key)
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
                    set_Contractor_level(item.Contractor_level)
                    set_selected_relation(item.budget_row)
                    form.setFieldsValue({
                        name: item.name,
                        code: item.code,
                        type: item.type,
                        price: item.price,
                        Contractor_id: item.Contractor_id,
                        Contractor: item.Contractor,
                        document_date: dayjs(new Date(item.document_date)),
                        contract_number: item.contract_number,
                        Contractor_type: item.Contractor_type,
                        Location: item.Location == null ? "" : item.Location,
                        budget_row: item.budget_row || "",
                        program: item.program || "",
                        cost_type: item.cost_type,
                        account_name: item.account_name,
                        bank_name: item.bank_name,
                        account_number: item.account_number,
                        total_contract_amount: item.total_contract_amount,
                        paid_amount: item.paid_amount,
                        final_payable_amount: item.final_payable_amount,
                        descr: item.descr,
                        files: item.uploads,

                    });
                    item.Location !== null ? set_selected_location(item.Location.id) && set_selected_organization(location.find(item => item.id === selected_location).organization_id) : ""

                    let Year = dayjs(item.document_date).format("YYYY");
                    api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
                        // console.log(r)
                        setlocation(r)
                    })
                    load_Contract_record(item.id)
                    setFileList(x)
                }
            })
        } else {
            let Year = form_date.format("YYYY");
            api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
                // console.log(r)
                setlocation(r)
            })

        }
    }, [prop.Fdata, prop.selectedid]);

    useEffect(() => {
        const documentDate = form.getFieldValue('document_date') || dayjs(new Date(), { jalali: true });
        let YearSelect = documentDate.format("YYYY");
        api().url("/api/budget_row?no_pagination=true" + `&year=${YearSelect}`).get().json().then(r => {
            setbudgetRow(r);
        });
    }, [form, form_date]);

    function load_Contract_record(id) {

        api().url("/api/contract_record?no_pagination=true&contract=" + id).get().json().then(r => {
            set_Contract_record(r.map(item => {
                return { ...item, key: item.id }
            }))
            r.map((item) => {
                printRefs[item.id] = React.createRef();
            });
            // console.log(r)
        })

    }

    useEffect(() => {

        let Year = form_date.format("YYYY");
        api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
            // console.log(r)
            setlocation(r)
        })

    }, [form_date])
    useEffect(() => {
        // if (is_fin && selected_organization) {
        loadRelation()


    }, [selected_organization])

    function loadRelation() {
        if (selected_organization !== null) {

            api().url("/api/relation?no_pagination=true&organization=" + selected_organization).get().json().then(r => {
                set_relation(r);
                console.log(r)
            })
        }
    }

    function load_contract_types() {
        api().url("/api/contractor_type?no_pagination=true&contractor_level=" + Contractor_level).get().json().then(r => {

            set_list_contract_types(r);
            if (r.length === 1) {
                form.setFieldsValue({ Contractor_type: r[0].id });
            }
        })
    }


    const delete_doc = () => {

        api().url("/api/contract/" + id).delete().res(r => {

            prop.remove(prop.selectedid)
            prop.modal(false)
        }
        ).then(r => {
            // console.log(r)
        })
    }
    // console.log(prop)
    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    //write fun that get the changed data from the form and update prop.Fdata with new data
    function updateData(data) {


    }

    function update_fin() {

        prop.update_fin.filter((item) => {
            if (item.id === Fdoc_key) {
                console.log(item.id)
                item.updated = dayjs(new Date())
            }
        })
        console.log(prop.update_fin)
    }

    const validateMessages = {
        required: "${label} is required!",
        types: {
            email: "${label} is not a valid email!",
            number: "${label} is not a valid number!",
        },
        number: {
            range: "${label} must be between ${min} and ${max}",
        },
    };
    const onFinish = (values) => {

        console.log(values);
        let jsondata = {
            "name": values.name,
            "type": values.type,
            "price": typeof values.price !== 'undefined' ? values.price : 0,
            "Contractor_id": values.Contractor_id,
            "Contractor": values.Contractor,
            "document_date": values.document_date,
            "Location": values.Location,
            "descr": values.descr,
            "uploads": fileList.map((file) => {
                return file.response.id
            })
            ,
            "bank_name": values.bank_name,
            "account_number": values.account_number,
            "account_name": values.account_name,
            "contract_number": values.contract_number,
            "Contractor_type": values.Contractor_type,
            "budget_row": values.budget_row,

            "program": values.program,
            "cost_type": values.cost_type,
            "total_contract_amount": values.total_contract_amount,
            "Contractor_level": Contractor_level,
        }
        let new_jasondata = { ...jsondata }

        new_jasondata.uploads = fileList.map((file) => {
            return {
                name: file.name,
                file: file.url,
                id: file.response.id
            }
        })


        let newContract_record = Contract_record.map((item) => {
            let newItem = { ...item };
            columns.forEach((column) => {
                if (column.hidden) {
                    if (typeof column.hidden === 'boolean' && column.hidden) {
                        newItem[column.dataIndex] = null;
                    } else if (Array.isArray(column.hidden) && column.hidden.includes(Contractor_level)) {
                        newItem[column.dataIndex] = null;
                    }
                }
            });
            return newItem;
        });

        prop.selectedid && updateData(new_jasondata)

        const request = prop.selectedid ? api().url(`/api/contract/${prop.selectedid}/`).put(jsondata).json() :
            api().url(`/api/contract/`).post(jsondata).json()

        request.then(data => {

            console.log(data)
            newContract_record.map((item) => {

                if (item.mode === "new") {
                    api().url(`/api/contract_record/`).post({
                        ...item,
                        Contract: data.id,
                        Contractor_level: Contractor_level
                    }).json()

                } else if (item.mode === "edit") {

                    api().url(`/api/contract_record/${item.id}/`).put({
                        ...item,
                        Contractor_level: Contractor_level
                    }).json()
                } else if (item.mode === "delete") {
                    api().url(`/api/contract_record/${item.id}/`).delete().json()
                }

            })
            set_Contract_record([])

            message.success("قرارداد با موفقیت ثبت شد")
            prop.selectedid && prop.update() //updateData(data)
            prop.selectedid && prop.modal(false)
            !prop.selectedid && form.resetFields() || setFileList([]);
        })
            .catch(error => {
                message.error("خطا در ثبت قرارداد")
                console.log(error)
            })


    };

    const columns = [
        {
            title: 'کد',
            dataIndex: 'id',
            render: (text, record) => parseInt(record.id).toLocaleString('fa-IR')
        },
        {
            title: 'شرح',
            dataIndex: 'descr',
            editable: true,
            render: (text, record) =>
                <Input defaultValue={text}
                    variant="borderless"
                    onChange={(value) => handleInputChange(value.target.value, record, 'descr')}
                />,
        },
        {
            title: "تاریخ پرداخت",
            dataIndex: "doc_date",
            editable: true,
            render: (text, record) => (
                <Input
                    defaultValue={toPersianNumbers(text)}
                    variant="borderless"
                    style={{ textAlign: "center" }}
                    onChange={(value) =>
                        handleInputChange(value.target.value, record, "doc_date")
                    } />
            ),
        },
        {
            title: 'مبلغ کارکرد',
            dataIndex: 'requested_performance_amount',
            editable: true,
            render: (text, record) => {
                const formattedValue = text ? toPersianNumbers(numberWithCommas(Math.floor(text))) : toPersianNumbers("0");
                return (
                    <InputNumber
                        defaultValue={formattedValue}
                        variant="borderless"
                        min={0}
                        onChange={(value) => handleInputChange(value, record, 'requested_performance_amount')}
                    />
                );
            },
        },

        {
            title: 'درصد کسر خزانه',
            dataIndex: 'treasury_deduction_percent',
            editable: true,
            render: (text, record) => (
                <InputNumber
                    defaultValue={toPersianNumbers(text)}
                    variant="borderless"
                    min={0}
                    onChange={(value) => handleInputChange(value, record, 'treasury_deduction_percent')}
                />

            ),
            hidden: ['c', 'a', 'd'].includes(Contractor_level),
        },

        {
            title: 'درصد بالاسری',
            dataIndex: 'overhead_percentage',
            editable: true,
            render: (text, record) => (
                <InputNumber
                    defaultValue={toPersianNumbers(text)}
                    variant="borderless"
                    min={0}
                    onChange={(value) => handleInputChange(value, record, 'overhead_percentage')}
                />

            ),
            hidden: ['c', 'a', 'd'].includes(Contractor_level),
        },

        {
            title: 'مبلغ قابل پرداخت پس از کسورات',
            dataIndex: 'payable_amount_after_deductions',
            render: (value) => {
                const result = value ? Math.floor(value) : 0; // Use Math.floor to remove decimal part
                return toPersianNumbers(numberWithCommas(result)); // Convert number to Persian
            },
            hidden: Contractor_level !== "b",
        },

        {
            title: 'درصد مالیات',
            dataIndex: 'tax_percentage',
            align: "center",
            editable: true,
            render: (text, record) => {
                const formattedValue = text ? toPersianNumbers(numberWithCommas(Math.floor(text))) : toPersianNumbers("0");
                return (
                    <InputNumber
                        defaultValue={formattedValue}
                        variant="borderless"
                        min={0}
                        onChange={(value) => handleInputChange(value, record, 'tax_percentage')}
                    />
                );
            },
        },

        {
            title: 'مبلغ مالیات',
            dataIndex: 'tax_amount',
            editable: true,
            render: (text, record) => {
                const formattedValue = text ? toPersianNumbers(numberWithCommas(Math.floor(text))) : toPersianNumbers("0");
                return (
                    <InputNumber
                        defaultValue={formattedValue}
                        variant="borderless"
                        onChange={(value) => handleInputChange(value, record, 'tax_amount')}
                    />
                );
            },
        },

        {
            title: 'مبلغ نهایی قابل پرداخت',
            dataIndex: 'final_payable_amount',
            render: (value) => {
                const result = value ? Math.floor(value) : 0; // Remove decimal part
                return toPersianNumbers(numberWithCommas(result)); // Convert to Persian numbers and format with commas
            },
        },
        {
            title: 'عملیات',
            dataIndex: 'operation',
            render: (_, record) => {


                return <>
                    <Popconfirm title="آیا مطمئن هستید که می‌خواهید حذف کنید؟"
                        onConfirm={() => handleDelete(record.key)}>
                        <a>حذف</a>
                    </Popconfirm>
                </>

            }

        },
        {
            title: "چاپ", key: 'print', align: 'center', render: (record) => {
                // console.log(record)
                const getOrganizationName = (locationId) =>
                    location.find((item) => item.id === locationId)?.organization_name || 'Not found';

                const getBudgetRowInfo = (budgetRowId) => {
                    const foundItem = relation.find((item) => item.budget_row?.id === budgetRowId);
                    if (foundItem?.budget_row) {
                        const { name, fin_code } = foundItem.budget_row;
                        return `${name}:${fin_code}`;
                    }
                    return 'Not found';
                };

                const getProgramInfo = (budgetRowId, programId) => {
                    const foundItem = relation.find((item) => item.budget_row?.id === budgetRowId);
                    const foundProgram = foundItem?.programs?.find((item) => item.id === programId);
                    if (foundProgram) {
                        const { name, fin_code } = foundProgram;
                        return `${name}:${fin_code}`;
                    }
                    return 'Not found';
                };

                const getCostType = (costTypeId) => {
                    const costTypes = {
                        0: "عمومی",
                        1: "اختصاصی",
                        2: "متفرقه و ابلاغی",
                        3: "تعمیر و تجهیز",
                        4: "تامین فضا"
                    };
                    return costTypes[costTypeId] || "نامشخص";
                };
                let data = {
                    ...record, ...form.getFieldsValue(),
                    organization: getOrganizationName(form.getFieldValue('Location')),
                    budget_row: getBudgetRowInfo(form.getFieldValue('budget_row')),
                    program: getProgramInfo(form.getFieldValue('budget_row'), form.getFieldValue('program')),
                    cost_type: getCostType(form.getFieldValue('cost_type')),
                    code: form.getFieldValue('code'),
                    Contractor_level: Contractor_level,
                    descr: record.descr,
                }

                return <>
                    <div
                        style={{ display: 'none' }}
                    >
                        <Contract_print key={`${JSON.stringify(data)}`} ref={printRefs[record.id]} record={data} />

                    </div>
                    <ReactToPrint
                        pageStyle="@media print {
                                          html, body {
                                            height: 100vh; /* Use 100% here to support printing more than a single page*/
                                            margin: 0 !important;
                                            padding: 0 !important;
                                          }
                                             .no-wrap {
                                                white-space: nowrap;
                                            }
                                        }"
                        trigger={() => <Button icon={<PrinterOutlined />}></Button>}
                        content={() => printRefs[record.id].current}
                    />
                </>
            }
        }
    ];

    const propsUpload = {
        name: "files",
        action: url + "/api/logistics-uploads/",
        headers: {
            authorization: `Bearer ${getToken("access")}`,
        },
        onChange(info) {
            let newFileList = [...info.fileList];
            newFileList = newFileList.map((file) => {
                if (file.response) {
                    file.url = file.response.file;
                }
                return file;
            });
            setFileList(newFileList);
            if (info.file.status !== "uploading")
                if (info.file.status === "done") {

                    message.success(`${info.file.name} file uploaded successfully`);

                } else if (info.file.status === "error") {
                    message.error(`${info.file.name} file upload failed.`);
                }
        },
        UploadFile: {
            crossOrigin: '*',

        }
        ,
        data(file) {
            // console.log(file)
            return {
                name: file.name,
                file: file
            }
        }
        , onDownload(file) {
            return file.response.file
        },
        fileList: fileList,
        onRemove(file) {
            api().url("/api/logistics-uploads/" + file.response.id).delete().res().then()

        }

    };

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

    return (

        <Form

            labelAlign="left"
            form={form}
            name="nest-messages"
            onFinish={onFinish}
            style={{
                Width: "100%",
            }}
            initialValues={{

                type: true,
                document_date: form_date,

            }}
            validateMessages={validateMessages}
            autoComplete="on"
        >

            <Row gutter={0} className={"pb-4 pt-2"}>
                <Radio.Group
                    value={Contractor_level}  // This will reflect the state value
                    size="large"
                    className={"my-4 ml-5"}
                    onChange={(e) => {
                        set_Contractor_level(e.target.value);
                    }}
                >
                    <Radio.Button value="b">طرح پژوهشی خارجی</Radio.Button>
                </Radio.Group> <Col span={1}>  </Col>
                <Form.Item name="code">
                    <span className="ant-form-text text-l">کد قرارداد: {toPersianNumbers(form.getFieldValue('code') || '-')}</span>
                </Form.Item>
            </Row>

            <Row gutter={50}>
                <Col span={6}>
                    <Form.Item
                        name="name"
                        label="عنوان"
                        rules={[
                            {
                                required: true,
                                message: "عنوان را وارد نمایید",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Col>

                <Col span={4}>
                    <Form.Item name="document_date" label="تاریخ قرارداد">
                        <DatePickerJalali
                            onChange={e => {
                                set_form_date(e)
                            }
                            }
                        />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="contract_number" label="شماره قرارداد">
                        <Input />

                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="Contractor_type" label="نوع خدمات" rules={[
                        {
                            required: true
                        },
                    ]}>
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder=" انتخاب  خدمات"
                            options={
                                list_contract_types.map((item) => {
                                    return { label: item.name, value: item.id }
                                })}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={50}>
                <Col span={8}>
                    <Form.Item
                        name="Contractor"
                        label="نام و نام خانوادگی/ شخص حقوقی"
                        rules={[
                            {
                                type: "text",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item
                        colon={false}
                        name="Contractor_id"
                        label={<p style={{}}>کد ملی/شناسه ملی/کد اقتصادی:</p>}
                        rules={[
                            {
                                type: "text",
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={10}>
                    <Form.Item name="Location" label="محل هزینه" rules={[
                        {
                            required: true
                        },
                    ]}>
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder=" انتخاب محل هزینه"
                            // optionFilterProp="children"
                            onChange={value => {
                                set_selected_location(value)
                                form.setFieldsValue({
                                    budget_row: undefined,
                                    program: undefined
                                });
                                set_selected_organization(location.find(item => item.id === value).organization_id)
                            }
                            }
                            options={

                                location.map((item) => {
                                    return { label: item.name, value: item.id }
                                })}
                        />

                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={50}>
                <Col span={8}>
                    <Form.Item name="budget_row" label="ردیف هزینه" >
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder=" انتخاب ردیف"
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
                </Col>
                <Col span={12}>
                    <Form.Item name="program" label="برنامه"
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
                </Col>
                <Col span={4}>
                    <Form.Item
                        label="نوع هزینه"
                        name="cost_type"
                    >
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder={" انتخاب نوع هزینه"}
                            options={
                                [
                                    { label: "عمومی", value: 0 },
                                    { label: "اختصاصی", value: 1 },
                                    { label: "متفرقه و ابلاغی", value: 2 },
                                    { label: "تعمیر و تجهیز", value: 3 },
                                    { label: "تامین فضا", value: 4 }
                                ]
                            }
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={50}>
                <Col span={6}>
                    <Form.Item
                        name="account_name"
                        label="در وجه"
                        rules={[
                            {
                                type: "text",
                            },
                        ]}
                    >
                        <Input placeholder="نام شخص" />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="bank_name" label="بانک" rules={[
                        {
                            required: false
                        },
                    ]}>
                        <Select
                            showSearch
                            filterOption={filterOption}
                            placeholder="انتخاب بانک"
                            options={
                                [
                                    { label: "بانک ملی ایران", value: "بانک ملی ایران" },
                                    { label: "بانک سپه", value: "بانک سپه" },
                                    { label: "بانک صنعت و معدن", value: "بانک صنعت و معدن" },
                                    { label: "بانک کشاورزی", value: "بانک کشاورزی" },
                                    { label: "بانک مسکن", value: "بانک مسکن" },
                                    { label: "بانک توسعه صادرات ایران", value: "بانک توسعه صادرات ایران" },
                                    { label: "بانک توسعه تعاون", value: "بانک توسعه تعاون" },
                                    { label: "پست بانک ایران", value: "پست بانک ایران" },
                                    { label: "بانک اقتصاد نوین", value: "بانک اقتصاد نوین" },
                                    { label: "بانک پارسیان", value: "بانک پارسیان" },
                                    { label: "بانک کارآفرین", value: "بانک کارآفرین" },
                                    { label: "بانک سامان", value: "بانک سامان" },
                                    { label: "بانک سینا", value: "بانک سینا" },
                                    { label: "بانک خاورمیانه", value: "بانک خاورمیانه" },
                                    { label: "بانک شهر", value: "بانک شهر" },
                                    { label: "بانک دی", value: "بانک دی" },
                                    { label: "بانک صادرات ایران", value: "بانک صادرات ایران" },
                                    { label: "بانک ملت", value: "بانک ملت" },
                                    { label: "بانک تجارت", value: "بانک تجارت" },
                                    { label: "بانک رفاه کارگران", value: "بانک رفاه کارگران" },
                                    { label: "بانک حکمت ایرانیان", value: "بانک حکمت ایرانیان" },
                                    { label: "بانک گردشگری", value: "بانک گردشگری" },
                                    { label: "بانک ایران زمین", value: "بانک ایران زمین" },
                                    { label: "بانک قوامین", value: "بانک قوامین" },
                                    { label: "بانک انصار", value: "بانک انصار" },
                                    { label: "بانک سرمایه", value: "بانک سرمایه" },
                                    { label: "بانک پاسارگاد", value: "بانک پاسارگاد" },
                                    { label: "بانک آینده", value: "بانک آینده" },
                                    { label: "بانک مهر اقتصاد", value: "بانک مهر اقتصاد" },
                                    { label: "بانک قرض‌الحسنه مهر ایران", value: "بانک قرض‌الحسنه مهر ایران" },
                                    { label: "بانک قرض‌الحسنه رسالت", value: "بانک قرض‌الحسنه رسالت" }
                                ]
                            }


                        />

                    </Form.Item>
                </Col>

                <Col span={12}>
                    <Form.Item
                        name="account_number"
                        label="شماره شبا"
                        rules={[
                            {
                                type: "text",
                            },
                        ]}
                    >
                        <Input
                            addonAfter={"IR"}
                            placeholder="" />
                    </Form.Item>
                </Col>


            </Row>
            <Row gutter={50}>
                <Col span={12}>
                    <Form.Item
                        name="total_contract_amount"
                        label="مبلغ کل قرارداد/ کل کارکرد"
                        rules={[
                            {
                                required: true,
                                type: "number",
                                min: 0,
                            },
                        ]}
                    >
                        <InputNumber
                            addonAfter={"﷼"}
                            formatter={(value) => toPersianNumbers(numberWithCommas(Math.floor(value)))}
                            parser={(value) => {
                                // Remove commas and convert Persian numbers to English
                                return parseFloat(value.replace(/,/g, '').replace(/[۰-۹]/g, (match) => {
                                    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                                    return persianNumbers.indexOf(match);
                                }));
                            }}
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="paid_amount"
                        label="مبلغ پرداخت شده"
                        initialValue={0} // Set default value to 0
                        rules={[
                            {
                                type: "number",
                                min: 0,
                            },
                        ]}
                    >
                        <InputNumber
                            addonAfter={"﷼"}
                            formatter={(value) => toPersianNumbers(numberWithCommas(Math.floor(value)))}
                            parser={(value) => {
                                // Remove commas and convert Persian numbers to English
                                return parseFloat(value.replace(/,/g, '').replace(/[۰-۹]/g, (match) => {
                                    const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
                                    return persianNumbers.indexOf(match);
                                }));
                            }}
                            style={{ width: "100%" }}
                            readOnly
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Row>
                <Col span={24}>
                    <Form.Item
                        name="descr"
                        label="توضیحات"
                        labelCol={{ span: 2 }}
                        wrapperCol={{ span: 22 }}
                    >
                        <Input.TextArea />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item wrapperCol={{ offset: 0 }}>
                <Button
                    onClick={handleAdd}
                    type="primary"
                    style={{
                        marginBottom: 16,
                    }}
                >
                    افزودن کارکرد
                </Button>
                <Button className={"mr-5"}
                    type="primary"
                    htmlType="submit"
                    onClick={() => {
                        // Perform submit logic here (e.g., API call to save data)
                        console.log("Submit clicked");
                    }}
                >
                    {prop.Fdata && Array.isArray(prop.Fdata) ? "ویرایش" : "ثبت"}
                </Button>
                {prop.Fdata && Array.isArray(prop.Fdata) &&
                    <Button
                        disabled={Fdoc_key !== null}
                        type="primary"
                        danger
                        className={"mr-5 mt-5"}
                        onClick={delete_doc}
                    >
                        حذف مدرک
                    </Button>
                }
            </Form.Item>
            <Table
                className={"p-0-cell "}
                dataSource={Contract_record.filter(item => item.mode !== "delete")}
                columns={columns}
                rowClassName="editable-row"
                pagination={false}
            />

            <Upload {...propsUpload}>
                <Button className={"mt-3"} icon={<UploadOutlined />}>ضمیمه فایل</Button>
            </Upload>

        </Form>
    );
};
export default Research_Doc;