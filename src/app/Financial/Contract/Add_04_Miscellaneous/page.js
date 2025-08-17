"use client";
import { AuthActions } from "@/app/auth/utils";
import { api } from "@/app/fetcher";
import Contract_func from "@/app/Financial/Contract/Print/Func_Print";
import { url } from "@/app/Server";
import { PrinterOutlined, FileSyncOutlined, FileExcelOutlined, FileAddOutlined, FileDoneOutlined } from "@ant-design/icons";
import { DatePicker as DatePickerJalali, jalaliPlugin, useJalaliLocaleListener, } from "@realmodule/antd-jalali";
import { Button, Col, Form, Input, InputNumber, message, Popconfirm, Radio, Row, Select, Table, Upload, } from "antd";
import dayjs from "dayjs";
import React, { useEffect, useState, useRef } from "react";
import ReactToPrint from "react-to-print";
import * as XLSX from "xlsx";
import store from 'store2';


export function numberWithCommas(x) {
  return x !== null ? x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : 0;
}

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

const Miscellaneous_Doc = (prop) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [Fdoc_key, set_Fdoc_key] = useState(null);
  const { handleJWTRefresh, storeToken, getToken } = AuthActions();
  const [location, setlocation] = useState([]);
  const [selected_location, set_selected_location] = useState([]);
  const [selected_organization, set_selected_organization] = useState([]);
  const [id, set_id] = useState(0);
  // const is_fin = Cookies.get("group") == "financial"
  const [budgetRow, setbudgetRow] = useState([]);
  const [relation, set_relation] = useState([]);
  const [selected_relation, set_selected_relation] = useState(0);
  const [list_contract_types, set_list_contract_types] = useState([]);
  const [Contractor_level, set_Contractor_level] = useState("d1"); // Set Default Contractor_level for this page
  const [Contract_record, set_Contract_record] = useState([]);
  const [printRefs, setPrintRefs] = useState({});
  useJalaliLocaleListener();
  dayjs.calendar("jalali");
  dayjs.extend(jalaliPlugin);
  const [form_date, set_form_date] = useState(
    dayjs(new Date(), { jalali: true })
  );
  useEffect(() => { }, []);
  const handleAdd = () => {
    const newData = {
      key: Contract_record.length + 1,
      last_name: "",
      contractor_id: 0,
      doc_descr: "",
      contract_num: 0,
      doc_date: "",
      account_number: 0,
      bank_name: "",
      requested_performance_amount: 0,
      tax_percentage: 0,
      tax_amount: 0,
      debt: 0,
      final_payable_amount: 0,
      mode: "new",
    };
    set_Contract_record([...Contract_record, newData]);
  };

  // Function to handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Process data starting from the second row
      const newRecord = jsonData.slice(1).map((row, index) => {
        const commonFields = {
          key: Contract_record.length + index + 1,
          last_name: row[0] || "",
          contractor_id: row[1] || 0,
          account_number: row[2] || 0,
          bank_name: row[3] || "",
          requested_performance_amount: row[4] || 0,
          tax_percentage: row[5] || 0,
          tax_amount: row[6] || 0,
          debt: row[7] || 0,
          final_payable_amount: row[8] || 0,
          mode: "uploaded"
        };

        if (Contractor_level === "d1") {
          return commonFields;
        } else if (Contractor_level === "d2") {
          return {
            ...commonFields,
            doc_descr: row[2] || "",
            contract_num: row[3] || 0,
            doc_date: row[4] || "",
            account_number: row[5] || 0, // Overwriting account_number if different position in "d2"
            bank_name: row[6] || "",     // Overwriting bank_name if different position in "d2"
            requested_performance_amount: row[7] || 0, // Overwriting requested_performance_amount if different position in "d2"
            tax_percentage: row[8] || 0, // Overwriting tax_percentage if different position in "d2"
            tax_amount: row[9] || 0,     // Overwriting tax_amount if different position in "d2"
            debt: row[10] || 0,          // Overwriting debt if different position in "d2"
            final_payable_amount: row[11] || 0 // Overwriting final_payable_amount if different position in "d2"
          };
        }
      });


      // Update the state with new records
      set_Contract_record([...Contract_record, ...newRecord]);
    };

    reader.readAsArrayBuffer(file);
  };

  // Trigger file input click
  const handleUploadButtonClick = () => {
    document.getElementById("fileInput").click();
  };

  // Function to handle file export
  const handleExport = () => {
    const data = Contract_record.filter((item) => item.mode !== "delete").map((record) => ({
      Amount: record.final_payable_amount,
      CreditIBAN: record.account_number,
      CurrencyCode: '', // Empty as per requirement
      CreditAccountOwnerName: record.last_name,
      CreditAccountOwnerIdentifier: '', // Empty as per requirement
      Identifier: '', // Empty as per requirement
      Description: '', // Empty as per requirement
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ACHGroupTransfer");

    XLSX.writeFile(wb, "CB-Template.xlsx");
  };

  const handleDelete = (key) => {
    const newData = Contract_record.filter((item) => {
      console.log(item.key === key);
      console.log(item.mode !== "new");
      if (item.key === key && item.mode !== "new") {
        item.mode = "delete";

        return true;
      }

      return item.key !== key;
    });
    console.log(newData);
    set_Contract_record(newData);
  };

  const calculateFinalPayableAmount = (record) => {
    const {
      requested_performance_amount,
      tax_percentage,
      debt
    } = record;

    const taxAmount = (requested_performance_amount * tax_percentage) / 100;
    const finalAmount = requested_performance_amount - taxAmount - debt;

    return {
      ...record,
      // tax_amount: taxAmount, // Assign calculated taxAmount to the tax_amount field      
      // final_payable_amount: finalAmount,
    };
  };

  useEffect(() => {
    console.log("Contractor Level:", Contractor_level); // Log Contractor Level for debugging

    // Recalculate all items when Contractor_level changes
    const updatedDataSource = Contract_record.map((item) => {
      const updatedItem = calculateFinalPayableAmount(item, Contractor_level);
      console.log("Updated Item:", updatedItem); // Log the updated item for debugging
      return updatedItem;
    });

    // Set the updated records to the state
    set_Contract_record(updatedDataSource);
    load_contract_types();
  }, [Contractor_level]); // Re-run when Contractor_level changes


  const handleInputChange = (value, record, dataIndex) => {
    const newData = Contract_record.map((item) => {
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

      item.updated = new Date()
      // Recalculate the item
      const recalculatedItem = calculateFinalPayableAmount(item, Contractor_level);
      newData.splice(index, 1, recalculatedItem);
      set_Contract_record(newData);
    }
  };


  useEffect(() => {
    if (prop.Fdata && Array.isArray(prop.Fdata)) {
      prop.Fdata.filter((item) => {
        if (item.id === prop.selectedid) {
          set_Fdoc_key(item.Fdoc_key);
          set_id(item.id);
          var x = item.uploads.map((file) => {
            return {
              uid: file,
              name: file.name,
              status: "done",
              url: file.file,
              response: {
                id: file.id,
                file: file.file,
              },
            };
          });
          set_Contractor_level(item.Contractor_level);
          set_selected_relation(item.budget_row);
          form.setFieldsValue({
            name: item.name,
            type: item.type,
            code: item.code,
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
          item.Location !== null ? set_selected_location(item.Location.id) && set_selected_organization(location.find((item) => item.id === selected_location).organization_id) : "";

          let Year = dayjs(item.document_date).format("YYYY");
          api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then((r) => {
            setlocation(r);
          });
          load_Contract_record(item.id);
          setFileList(x);
        }
      });
    } else {
      let Year = form_date.format("YYYY");
      api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
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
    })

  }

  useEffect(() => {

    let Year = form_date.format("YYYY");
    api().url("/api/subUnit?no_pagination=true" + `&year=${Year}`).get().json().then(r => {
      setlocation(r)
    })

  }, [form_date])
  useEffect(() => {
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
    })
  }

  const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

  function updateData(data) { }

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

    // Prepare the main contract data
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
      "uploads": fileList.map((file) => { return file.response.id }),
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
    };

    // Prepare the uploads data
    let new_jasondata = { ...jsondata }

    new_jasondata.uploads = fileList.map((file) => {
      return {
        name: file.name,
        file: file.url,
        id: file.response.id
      }
    })

    // Prepare the Contract_record data
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

    // Update or create the contract
    const request = prop.selectedid
      ? api().url(`/api/contract/${prop.selectedid}/`).put(jsondata).json()
      : api().url(`/api/contract/`).post(jsondata).json()

    request.then(data => {
      console.log(data)

      // Save the Contract_record data
      newContract_record.map((item) => {

        if (item.mode === "new" || item.mode === "uploaded") { // if (item.mode === "new") {
          api().url(`/api/contract_record/`).post({
            ...item,
            Contract: data.id, // Link to the created/updated contract
            Contractor_level: Contractor_level
          }).json();

        } else if (item.mode === "edit") {

          api().url(`/api/contract_record/${item.id}/`).put({
            ...item,
            Contractor_level: Contractor_level
          }).json()
        } else if (item.mode === "delete") {
          api().url(`/api/contract_record/${item.id}/`).delete().json()
        }
      });

      // Reset the form and state
      set_Contract_record([])

      message.success("قرارداد با موفقیت ثبت شد")
      prop.selectedid && prop.update(); // Update the parent component if needed
      prop.selectedid && prop.modal(false); // Close the modal if editing
      !prop.selectedid && form.resetFields(); // Reset the form if creating a new contract
      setFileList([]); // Clear the file list
    })
      .catch(error => {
        message.error("خطا در ثبت قرارداد")
        console.log(error)
      })
  };

  const columns = [
    {
      title: "نام و نام خانوادگی",
      dataIndex: "last_name",
      editable: true,
      render: (text, record) => (
        <Input
          defaultValue={text}
          variant="borderless"
          style={{ textAlign: "center" }}
          onChange={(value) =>
            handleInputChange(value.target.value, record, "last_name")
          }
        />
      ),
    },

    {
      title: "کد ملی",
      dataIndex: "contractor_id",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(Math.floor(text))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            min={0}
            onChange={(value) =>
              handleInputChange(value, record, "contractor_id")
            }
          />
        );
      },
    },

    {
      title: "شرح سند",
      dataIndex: "doc_descr",
      editable: true,
      render: (text, record) => (
        <Input
          defaultValue={toPersianNumbers(text)}
          variant="borderless"
          style={{ textAlign: "center" }}
          onChange={(value) =>
            handleInputChange(value.target.value, record, "doc_descr")
          }
        />
      ),
      hidden: Contractor_level !== "d2",
    },

    {
      title: "شماره قرارداد",
      dataIndex: "contract_num",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(text)
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            min={0}
            onChange={(value) =>
              handleInputChange(value, record, "contract_num")
            }
          />
        );
      },
      hidden: Contractor_level !== "d2",
    },

    {
      title: "تاریخ قرارداد",
      dataIndex: "doc_date",
      editable: true,
      render: (text, record) => (
        <Input
          defaultValue={toPersianNumbers(text)}
          variant="borderless"
          style={{ textAlign: "center" }}
          onChange={(value) =>
            handleInputChange(value.target.value, record, "doc_date")
          }
        />
      ),
      hidden: Contractor_level !== "d2",
    },

    {
      title: "شماره حساب",
      dataIndex: "account_number",
      editable: true,
      render: (text, record) => (
        <Input
          defaultValue={toPersianNumbers(text)}
          variant="borderless"
          style={{ textAlign: "center" }}
          onChange={(value) =>
            handleInputChange(value.target.value, record, "account_number")
          }
        />
      ),
    },

    {
      title: "بانک",
      dataIndex: "bank_name",
      editable: true,
      render: (text, record) => (
        <Input
          defaultValue={text}
          variant="borderless"
          style={{ textAlign: "center" }}
          onChange={(value) =>
            handleInputChange(value.target.value, record, "bank_name")
          }
        />
      ),
    },

    {
      title: "درصد مالیات",
      dataIndex: "tax_percentage",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(numberWithCommas(text))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            onChange={(value) =>
              handleInputChange(value, record, "tax_percentage")
            }
          />
        );
      },
    },

    {
      title: "مبلغ ناخالص",
      dataIndex: "requested_performance_amount",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(numberWithCommas(Math.floor(text)))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            min={0}
            onChange={(value) =>
              handleInputChange(value, record, "requested_performance_amount")
            }
          />
        );
      },
    },

    {
      title: "مبلغ مالیات",
      dataIndex: "tax_amount",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(numberWithCommas(Math.floor(text)))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            onChange={(value) => handleInputChange(value, record, "tax_amount")}
          />
        );
      },
    },

    {
      title: "بدهی",
      dataIndex: "debt",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(numberWithCommas(Math.floor(text)))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            onChange={(value) => handleInputChange(value, record, "debt")}
          />
        );
      },
    },

    {
      title: "خالص پرداختی",
      dataIndex: "final_payable_amount",
      editable: true,
      render: (text, record) => {
        const formattedValue = text
          ? toPersianNumbers(numberWithCommas(Math.floor(text)))
          : toPersianNumbers("0");
        return (
          <InputNumber
            defaultValue={formattedValue}
            variant="borderless"
            min={0}
            onChange={(value) =>
              handleInputChange(value, record, "final_payable_amount")
            }
          />
        );
      },
    },

    {
      title: "عملیات",
      dataIndex: "operation",
      render: (_, record) => {
        return (
          <>
            <p></p>
            <Popconfirm
              title="آیا مطمئن هستید که می‌خواهید حذف کنید؟"
              onConfirm={() => handleDelete(record.key)}
            >
              <a>حذف</a>
            </Popconfirm>
          </>
        );
      },
    },
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
      if (info.file.status !== "uploading") {
      }
      if (info.file.status === "done") {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === "error") {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
    UploadFile: {
      crossOrigin: "*",
    },
    data(file) {
      return {
        name: file.name,
        file: file,
      };
    },
    onDownload(file) {
      return file.response.file;
    },
    fileList: fileList,
    onRemove(file) {
      api()
        .url("/api/logistics-uploads/" + file.response.id)
        .delete()
        .res()
        .then();
    },
  };

  const printRef = useRef();

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

  const data = {
    organization: getOrganizationName(form.getFieldValue('Location'), location),
    budget_row: getBudgetRowInfo(form.getFieldValue('budget_row'), relation),
    program: getProgramInfo(form.getFieldValue('budget_row'), form.getFieldValue('program'), relation),
    cost_type: getCostType(form.getFieldValue('cost_type')),
    Contractor_level: form.getFieldValue('Contractor_level'),
    descr: form.getFieldValue('descr'),
    contract_number: form.getFieldValue('contract_number'),
    code: form.getFieldValue('code'),
  };


  // Get the table and Pass dataSource and columns as props
  const tableProps = {
    dataSource: Contract_record.filter((item) => item.mode !== "delete"),
    columns: columns,
  };

  // Save the props to localStorage or pass them to Func_print.js  
  store.set('tableProps', tableProps);


  const combinedRecord = {
    ...data,
    Contractor_level: Contractor_level,
    id: id
  };


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
      // onFinishFailed={onFinishFailed}
      autoComplete="on"
    >
      <Row gutter={0} className={"pb-6"}>
        <Radio.Group
          value={Contractor_level} // This will reflect the state value
          size="large"
          className={"my-4"}
          onChange={(e) => {
            set_Contractor_level(e.target.value);
          }}
        >
          <Radio.Button value="d1">قالب ۱</Radio.Button>
          <Radio.Button value="d2">قالب ۲</Radio.Button>
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
          <Form.Item name="document_date" label="تاریخ سند">
            <DatePickerJalali
              onChange={(e) => {
                set_form_date(e);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="contract_number" label="شماره سند">
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="Contractor_type"
            label="نوع خدمات"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              showSearch
              filterOption={filterOption}
              placeholder=" انتخاب  خدمات"
              options={list_contract_types.map((item) => {
                return { label: item.name, value: item.id };
              })}
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={50}>
        <Col span={8}>
          <Form.Item
            name="Location"
            label="محل هزینه"
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              showSearch
              filterOption={filterOption}
              placeholder=" انتخاب محل هزینه"
              onChange={(value) => {
                set_selected_location(value);
                form.setFieldsValue({
                  budget_row: undefined,
                  program: undefined,
                });
                set_selected_organization(
                  location.find((item) => item.id === value).organization_id
                );
              }}
              // onSearch={onSearch}
              // filterOption={filterOption}
              options={location.map((item) => {
                return { label: item.name, value: item.id };
              })}
            />
          </Form.Item>
        </Col>
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
        <Col span={8}>
          <Form.Item name="program" label="برنامه">
            <Select
              showSearch
              filterOption={filterOption}
              placeholder=" انتخاب برنامه"
              options={relation
                .filter((item) => item.budget_row.id === selected_relation)
                .flatMap((item) =>
                  item.programs.map((program) => ({
                    label: program.name,
                    value: program.id,
                  }))
                )}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={50}>
        <Col span={10}>
          <Form.Item label="محل اعتبار" name="cost_type">
            <Select
              showSearch
              filterOption={filterOption}
              placeholder={" انتخاب نوع هزینه"}
              options={[
                { label: "عمومی", value: 0 },
                { label: "اختصاصی", value: 1 },
                { label: "متفرقه و ابلاغی", value: 2 },
                { label: "تعمیر و تجهیز", value: 3 },
                { label: "تامین فضا", value: 4 },
              ]}
            />
          </Form.Item>
        </Col>
        <Col span={14}>
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
              formatter={(value) => value.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
              parser={(value) => {
                const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹",];
                const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9",];
                let newValue = value;
                for (let i = 0; i < 10; i++) {
                  newValue = newValue.replace(
                    new RegExp(persianNumbers[i], "g"),
                    englishNumbers[i]
                  );
                }
                return newValue?.replace(/\$\s?|(,*)/g, "");
              }}
              style={{ width: "100%" }}
              readOnly
            />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        {Contractor_level === "d1" && (
          <Col span={24}>
            <Form.Item
              name="descr"
              label="شرح سند"
              labelCol={{ span: 2 }}
              wrapperCol={{ span: 22 }}
            >
              <Input.TextArea />
            </Form.Item>
          </Col>
        )}
        {Contractor_level === "d2" && (
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
        )}
      </Row>
      <Form.Item wrapperCol={{ offset: 0 }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button
            onClick={handleAdd}
            type="primary"
            style={{
              marginBottom: 16,
            }}
          >
            افزودن کارکرد
          </Button>
          <Button
            className={""}
            type="primary"
            htmlType="submit"
            onClick={() => {
              // Perform submit logic here (e.g., API call to save data)
              console.log("Submit clicked");
            }}
          >
            {prop.Fdata && Array.isArray(prop.Fdata) ? "ویرایش" : "ثبت"}
          </Button>
          {prop.Fdata && Array.isArray(prop.Fdata) && (
            <Button
              disabled={Fdoc_key !== null}
              type="primary"
              danger
              className={""}
              onClick={delete_doc}
            >
              حذف مدرک
            </Button>
          )}
          <p className={"text-center text-white text-2xl"}> ___ </p>

          {Contractor_level === "d1" && (<a href="/samples/Sample1.xlsx" download>
            <Button type="default" className={""} icon={<FileExcelOutlined />}>
              دانلود قالب
            </Button>
          </a>)}
          {Contractor_level === "d2" && (<a href="/samples/Sample2.xlsx" download>
            <Button type="default" className={""} icon={<FileExcelOutlined />}>
              دانلود قالب
            </Button>
          </a>)}

          {/* Hidden file input */}
          <input
            id="fileInput"
            type="file"
            accept=".xlsx, .xls"
            style={{ display: "none" }}
            onChange={handleFileUpload}
          />
          {/* Upload Template Button */}
          <Button
            type="default"
            className={""} icon={<FileSyncOutlined />}
            onClick={handleUploadButtonClick}
          >
            آپلود قالب
          </Button>

          <div>
            <div style={{ display: 'none' }}>
              <Contract_func key={`${JSON.stringify(combinedRecord)}`}
                ref={printRef} record={combinedRecord} />

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
              trigger={() => (
                <Button
                  type="primary"
                  className={""}
                  icon={<PrinterOutlined />}
                >
                  پرینت کارکرد
                </Button>
              )}
              content={() => printRef.current}
            />
          </div>
          <Button
            type="default"
            className={""}
            icon={<FileDoneOutlined />}
            onClick={handleExport}
          >
            قالب بانک مرکزی
          </Button>
          <p className={"text-center text-white text-2xl"}> ___ </p>
          <Upload {...propsUpload}>
            <Button className={""} icon={<FileAddOutlined />}>
              ضمیمه فایل
            </Button>
          </Upload>
        </div>

      </Form.Item>

      <Table
        className={"p-0-cell"}
        dataSource={Contract_record.filter((item) => item.mode !== "delete")}
        columns={columns}
        rowClassName="editable-row"
        pagination={false}
      />

    </Form>
  );
};
export default Miscellaneous_Doc;
