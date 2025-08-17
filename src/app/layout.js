"use client";
import Menur from "@/app/components/menu/menu";
import { api, fetcher, getGroup } from "@/app/fetcher";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider, message } from "antd";
import fa_IR from "antd/lib/locale/fa_IR";
import "@/styles/globals.css";
import Cookies from "js-cookie";
import localFont from "next/font/local";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useState } from "react";
import arm from "../images/Arm.jpg";


const yekan = localFont({
  src: [
    {
      path: "../Fonts/Yekan.ttf",
      weight: "400",
      style: "normal",
      preload: "true",
    },
    {
      path: "../Fonts/Yekan.eot",
      weight: "400",
      style: "normal",
      preload: "true",
    },
    {
      path: "../Fonts/Yekan.woff",
      weight: "400",
      style: "normal",
      preload: "true",
    },
  ],
});
const Metadata = {
  title: "تدبیر بودجه",
  description: "پروژه تدبیر بودجه دانشگاه هنر اسلامی تبریز",
};
const RefreshLayoutContext = createContext();
export const useRefreshLayout = () => useContext(RefreshLayoutContext);

export const RefreshLayoutProvider = ({ children, value }) => (
  <RefreshLayoutContext.Provider value={value}>
    {children}
  </RefreshLayoutContext.Provider>
);

export default function RootLayout({ children, metadata = Metadata }) {
  const nextRouter = usePathname();
  const [username, setUsername] = useState("");
  const [group, set_group] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [key, setKey] = useState(0);
  const router = useRouter();

  const refreshLayout = () => {
    setUsername(Cookies.get("username"));
    set_group(Cookies.get("group"));
    setIsLoggedIn(Cookies.get("login") === "1");
  };
  useEffect(() => {    

    //بعدا حذف شود
    if (Cookies.get("login") === "1" && !Cookies.get("group")) {
      getGroup().then((value) => {
        Cookies.set("group", value.toString());
        set_group(Cookies.get("group"));
      });
    }
    //بعدا حذف شود
    if (Cookies.get("login") === "1" && !Cookies.get("admin")) {
      fetcher("/get_user_info").then((data) => {
        Cookies.set("username", data.name);
      });
    }
    if (
      Cookies.get("login") === "1" &&
      (Cookies.get("group") === "Logistics" ||
        Cookies.get("group") === "Financial")
    ) {
      api()
        .url(`/api/pettycash/?get_nulls=true`)
        .get()
        .json()
        .then((res) => {
          console.log(res);
          if (res.count > 0) {
            message.info("تنخواهی برای بررسی موجود است", 10);
            router.push("/Logistics/Tankhah/list");
          }
        });
    }
    setIsLoggedIn(Cookies.get("login") === "1");
    set_group(Cookies.get("group"));
    //////////
    setUsername(Cookies.get("username"));
  }, []);
  return (
    <html lang="en" dir="rtl">
      <ConfigProvider
        locale={fa_IR}
        direction="rtl"
        theme={{
          token: {
            fontFamily: "Yekan",
          },
        }}
      >
        <body className={` bg-slate-200 `}>
          <AntdRegistry>
            <RefreshLayoutProvider value={refreshLayout}>

              {/* Provide the context */}
              <div className="flex bg-slate-200  flex-row pt-10 px-10 justify-between items-start	">
                <div className="basis-2/12 pl-6">
                  <div className="bg-white rounded-lg p-2">
                    <div className={"bg-white pb-5"}>
                      <Image
                        src={arm}
                        alt="Picture of the author"
                        className={"p-5"}
                      />
                      <p className={"text-black text-center text-lg"}>
                        <b>{username || ""}</b>
                      </p>
                    </div>

                    <div className="border custom-border rounded-lg">
                      {isLoggedIn && <Menur className={"p-10"} group={group} />}
                    </div>
                  </div>
                </div>
                <div
                  className={`min-h-screen basis-10/12 bg-white rounded-lg py-7 px-10 yekan`}
                >
                  {children}
                </div>
              </div>
            </RefreshLayoutProvider>
          </AntdRegistry>
        </body>
      </ConfigProvider>
    </html>
  );
}
