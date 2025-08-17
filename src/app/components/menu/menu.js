'use client';

import { AuthActions } from "@/app/auth/utils";
import {
  AppstoreOutlined,
  BookOutlined,
  CalculatorOutlined,
  ContainerOutlined,
  DiffOutlined,
  FileProtectOutlined,
  WalletOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { Menu } from 'antd';
import { usePathname, useRouter } from "next/navigation";
import React from 'react';

function getItem(label, key, icon, children, type) {
  return {
    key,
    icon,
    children,
    label,
    type,
  };
}

const handleLogout = (router) => {
  const { logout, removeTokens } = AuthActions();
  logout()
    .res(() => {
      removeTokens();
      router.push("/");
    })
    .catch(() => {
      removeTokens();
      router.push("/");
    });
};

const Menur = ({ group }) => {
  const router = useRouter();
  const nextRouter = usePathname();

  const items = [
    getItem('حساب کاربری', 'grp', <AppstoreOutlined />, [
      getItem('داشبورد', '17'),
      getItem('تغییر پسورد', '15'),
      getItem('خروج', '16')]),
  ];

  const logistic = [
    getItem('تدارکات', 'sub1', <DiffOutlined />, [
      getItem('ایجاد مدارک', 'l1'),
      getItem('لیست مدارک', 'l2'),
      getItem('ایجاد سند', 'l3'),
      getItem('لیست اسناد', 'l4'),
    ]),
    getItem('تنخواه گردان', null, <BookOutlined />, [
      getItem('ثبت تنخواه', 'l6'),
      getItem('لیست تنخواه', 'l7'),
      getItem('گزارش تنخواه', 'l8')]),

    { type: 'divider' },
  ];

  const financial = [
    getItem('لیست اسناد مالی', 'fin00', <BookOutlined />, [
      getItem('اسناد تدارکات', 'f01'),
      getItem('طرح پژوهشی خارجی', 'f02'),
      getItem('صورت وضعیت عمرانی', 'f03'),
      getItem('کارکردهای متفرقه', 'f04'),
      getItem('قراردادها', 'f05', <ContainerOutlined />, [ // Pass the subcategories as children
        getItem('شرکتهای تامین نیرو', 'f051'),
        getItem('کارکردهای ماهانه', 'f052'),
        getItem('انتظامات شب', 'f053'),
        getItem('سایر قراردادها', 'f054'),
      ]),
    ]),

    { type: 'divider' },
    getItem('گزارشات', 'rep00', <BarChartOutlined />, [
      getItem('مراکز هزینه', 'r01'),
      getItem('اسناد تدارکات', 'r02'),
    ]),

    { type: 'divider' },
    getItem('تنخواه گردان', null, <WalletOutlined />, [
      getItem('ثبت تنخواه', 'l6'),
      getItem('لیست تنخواه', 'l7'),
      getItem('گزارش تنخواه', 'l8'),
    ]),
  ];


  const budget = [
    getItem('بودجه ریزی', 'sub3', <FileProtectOutlined />, [
      getItem('برنامه', 'l100'),
      getItem('فرم پنج', 'l101'),
      getItem('مراکز هزینه', 'l102'),
      getItem('روابط', 'l103'),
    ]),

    { type: 'divider' },
    getItem('گزارشات', 'rep00', <BarChartOutlined />, [
      getItem('مراکز هزینه', 'r01'),
      getItem('اسناد تدارکات', 'r02'),
    ]),
  ];

  const Reports = [
    getItem('گزارشات', 'rep00', <BarChartOutlined />, [
      getItem('مراکز هزینه', 'r01'),
      getItem('اسناد تدارکات', 'r02'),
    ]),
  ];

  if (group && group.toString().startsWith("logistics")) {
    items.unshift(...logistic);
  } else if (group && group.toString().startsWith("financial")) {
    items.unshift(...financial);
  } else if (group && group.toString().startsWith("budget")) {
    items.unshift(...budget);
  } else if (group && group.toString().startsWith("Total")) {
    items.unshift(...Reports);
  }

  const onClick = (e) => {
    if (e.key === 'l1') router.push('/Logistics/Docs');
    if (e.key === 'l2') router.push('/Logistics/Docs_List');
    if (e.key === 'l3') router.push('/Logistics/Financial_docs');
    if (e.key === 'l4') router.push('/Logistics/Financial_List');
    if (e.key === 'l6') router.push('/Logistics/Tankhah/sabt');
    if (e.key === 'l7') router.push('/Logistics/Tankhah/list');
    if (e.key === 'l8') router.push('/Logistics/Tankhah/report');
    if (e.key === '17') router.push('/dashboard');
    if (e.key === '15') router.push('/password/reset-password');
    if (e.key === '16') handleLogout(router);
    if (e.key === 'l100') router.push('/budget/program');
    if (e.key === 'l101') router.push('/budget/form5');
    if (e.key === 'l102') router.push('/budget/costcenter');
    if (e.key === 'l103') router.push('/budget/relation');
    if (e.key === 'f01') router.push('/Financial/01-Financial_List');
    if (e.key === 'f02') router.push('/Financial/02-Research_Plan');
    if (e.key === 'f03') router.push('/Financial/03-Construction_Report');
    if (e.key === 'f04') router.push('/Financial/04-Miscellaneous_Functions');
    if (e.key === 'f051') router.push('/Financial/051-Supply_Companies');
    if (e.key === 'f052') router.push('/Financial/052-Monthly_Functions');
    if (e.key === 'f053') router.push('/Financial/053-Night_Staff');
    if (e.key === 'f054') router.push('/Financial/054-Other_Contracts');
    if (e.key === 'r01') router.push('/Reports');
    if (e.key === 'r02') router.push('/Reports/Details');
  };

  return (
    <Menu
      onClick={onClick}
      style={{
        width: "100%",
        direction: "rtl"
      }}
      defaultSelectedKeys={['1']}
      defaultOpenKeys={['sub1', 'sub2', 'sub3']}
      mode="inline"
      items={items}
    />
  );
};

export default Menur;
