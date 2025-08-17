"use client";
import React from "react";
import { AuthActions } from "@/app/auth/utils";
import type { FormProps } from "antd";
import { Button, Form, Input, message } from "antd";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Cookies from "js-cookie";
import { getGroup } from "@/app/fetcher";

type FormData = {
  email: string;
  password: string;
};

type FieldType = {
  email: string;
  username?: string;
  password?: string;
};

const Login = () => {
  const router = useRouter();

  const { login, storeToken } = AuthActions();
  const onFinish: FormProps<FieldType>["onFinish"] = (data) => {
    login(data.username, data.password)
      .json((json) => {
        Cookies.set("login", String(1));
        storeToken(json.access, "access");
        storeToken(json.refresh, "refresh");
        //force to rerender layout page
        router.refresh();
        getGroup().then((value) => {
          Cookies.set("group", value.toString());
          console.log(value);
        });
        router.push("dashboard");
      })
      .catch((err) => {
        console.log(err.text);        
        message.error(err.json?.detail || "اطلاعات صحیح نیست");        
      });
  };
  const onFinishFailed: FormProps<FieldType>["onFinishFailed"] = (
    errorInfo
  ) => {
    console.log("Failed:", errorInfo);
  };
  return (
    <Form
      name="basic"
      labelCol={{ span: 8 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      initialValues={{ remember: true }}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      autoComplete="off"
    >
      <Form.Item
        label="نام کاربری"
        name="username"
        rules={[
            { required: true, message: "لطفا نام کاربری را وارد کنید!" },
            { pattern: /^[a-zA-Z0-9_]+$/, message: "فقط حروف و اعداد مجاز هستند." },
          ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="پسورد"
        name="password"
        rules={[
            { required: true, message: "لطفا پسورد را وارد کنید!" },
            { min: 6, message: "پسورد باید حداقل 6 کاراکتر باشد." }, // Example: minimum length
          ]}
      >
        <Input.Password />
      </Form.Item>

      <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
        <Button type="primary" htmlType="submit">
          ورود
        </Button>
      </Form.Item>
      <div className="mt-6 text-center">
        <Link
          href="/auth/password/reset-password"
          className="text-sm text-blue-600 hover:underline"
        >
          فراموشی رمز
        </Link>
      </div>
    </Form>
  );
};

export default Login;
