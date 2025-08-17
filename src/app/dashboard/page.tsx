"use client";

import { fetcher } from "@/app/fetcher";
import { AuthActions } from "@/app/auth/utils";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRefreshLayout } from "@/app/layout";
import Header from "@/app/components/Header";
import { Toaster, toast } from "sonner";
import CostCentersPieChart from "../components/CostCentersPieChart";

export default function Dashboard() {
  const router = useRouter();
  const [user, set_user] = useState<any>();
  const refreshLayout = useRefreshLayout();

  useEffect(() => {
    fetcher("/get_user_info")
      .then((data) => {
        set_user(data);
        Cookies.set("username", data.name);
        Cookies.set("admin", data.admin);
        refreshLayout();
        toast.success(`خوش آمدید ${data.name}`, {
          position: "bottom-left",
          duration: 3000,
        });
      })
      .catch((error) => {
        toast.error("خطا در دریافت اطلاعات کاربر", {
          position: "bottom-left",
          duration: 3000,
        });
      });
  }, [refreshLayout]);

  const handleLogout = () => {
    const { logout, removeTokens } = AuthActions();
    toast.info("در حال خروج از حساب کاربری...", {
      position: "bottom-left",
      duration: 3000,
    });
    
    logout()
      .res(() => {
        removeTokens();
        toast.success("با موفقیت خارج شدید", {
          position: "bottom-left",
          duration: 3000,
        });
        setTimeout(() => router.push("/"), 1000);
      })
      .catch(() => {
        removeTokens();
        toast.error("خطا در خروج از حساب", {
          position: "bottom-left",
          duration: 3000,
        });
        setTimeout(() => router.push("/"), 1000);
      });
  };

  return (
    <>
      <Toaster richColors />
      <div>
        <Header />
      </div>
      <div className="flex flex-row py-10 items-stretch rounded-lg justify-center h-full">
        <div
          title="Notifications"
          className="flex-1 bg-sky-50 rounded-lg shadow-lg text-center text-black container mx-auto ml-5"
        >
          <p className="bg-sky-300 rounded-t-lg text-2xl font-bold mb-4 pb-3 pt-2 w-full">
            پیام ها
          </p>
          <p className="text-center px-4 pt-2 text-xl font-bold text-green-500">
            قابل توجه تمامی همکاران ارجمند: سامانه به نسخه جدید ارتقا یافت،
            در صورت بروز هرگونه خطا حین استفاده از سامانه لطفا موارد را به مدیریت اداره بودجه و تشکیلات اطلاع داده یا با داخلی ۳۱۲ (صفاری) تماس حاصل فرمایید.
          </p>
        </div>
        <div
          title="Summery"
          className="flex-1 bg-sky-50 pb-4 rounded-lg shadow-lg text-center text-black container mx-auto mr-5"
        >
          <h1 className="bg-sky-300 rounded-t-lg text-2xl font-bold mb-4 pb-3 pt-2 w-full">
            کاربر : {user?.name} ، خوش آمدید!
          </h1>
          <p className="mb-4"> مشخصات حساب کاربری:</p>
          <ul className="mb-4">
            <li>username: {user?.username}</li>
          </ul>
          <button
            onClick={handleLogout}
            title="Disconnect"
            className="bg-red-500 text-white items-center text-center px-4 py-2 rounded hover:bg-gray-500 transition-colors"
          >
            <b>خروج از حساب</b>
          </button>
        </div>       
      </div>
      <div title="Chart" className="rounded-lg shadow-lg"><CostCentersPieChart /></div>
    </>
  );
}