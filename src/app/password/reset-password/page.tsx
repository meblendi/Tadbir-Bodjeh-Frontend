"use client";

// export default function Home() {
//     return (
//         <main>
//             {/*<ResetPassword/>*/}
//
//
//         </main>
//     );
// }
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { api } from "@/app/fetcher";
import Header from "@/app/components/Header";

// import axios from 'axios';

interface PasswordResetFormData {
  old_password: string;
  new_password: string;
  confirm_new_password: string;
}

const PasswordReset: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<PasswordResetFormData>();
  const [resetStatus, setResetStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const onSubmit = async (data: PasswordResetFormData) => {
    setResetStatus("loading");
    // try {
    const response = api()
      .url("/api/password-reset/")
      .patch({
        old_password: data.old_password,
        new_password: data.new_password,
      })
      .res((response) => {
        // console.log(response.)

        setResetStatus("success");
      })
      .catch((response) => {
        if (response.status === 400) {
          setResetStatus("error");
        }
        // console.log(response.toString())
      });

    // if (response.status === 204) {
    //   setResetStatus('success');
    // } else {
    //   setResetStatus('error');
    // }
    // } catch (error) {
    //   setResetStatus('error');
    // }
  };

  return (
    <>
      <div>
        <Header />
      </div>
      <div className="max-w-md mx-auto mt-8">
        <h2 className="text-2xl text-black text-center font-bold mb-4">تغییر گذر واژه</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="old_password" className="block mb-1 text-black">
              گذر واژه قدیمی
            </label>
            <input
              type="password"
              id="old_password"
              {...register("old_password", {
                required: "Old password is required",
              })}
              className="text-black w-full px-3 py-2 border rounded border-gray-400"
            />
            {errors.old_password && (
              <p className="text-red-500 text-sm">
                {errors.old_password.message}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="new_password" className="block mb-1 text-black">
              گذر واژه جدید
            </label>
            <input
              type="password"
              id="new_password"
              {...register("new_password", {
                required: "New password is required",
                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },
              })}
              className="text-black w-full px-3 py-2 border rounded border-gray-400"
            />
            {errors.new_password && (
              <p className="text-red-500 text-sm">
                {errors.new_password.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="confirm_new_password"
              className="block mb-1 text-black"
            >
              تایید گذر واژه جدید
            </label>
            <input
              type="password"
              id="confirm_new_password"
              {...register("confirm_new_password", {
                required: "Please confirm your new password",
                validate: (value) =>
                  value === watch("new_password") || "Passwords do not match",
              })}
              className="text-black w-full px-3 py-2 border rounded border-gray-400"
            />
            {errors.confirm_new_password && (
              <p className="text-red-500 text-sm">
                {errors.confirm_new_password.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            // disabled={resetStatus === 'loading'}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition duration-200"
          >
            {resetStatus === "loading" ? "در حال تغییر" : "تغییر گذر واژه"}
          </button>
        </form>
        {resetStatus === "success" && (
          <p className="text-green-500 text-center mt-4">گذر واژه با موفقیت تغییر یافت</p>
        )}
        {resetStatus === "error" && (
          <p className="text-red-500 text-center mt-4">
            بازنشانی رمز عبور ناموفق بود. لطفا دوباره تلاش کنید ممکن است رمز
            عبور قدیمی نادرست باشد
          </p>
        )}
      </div>
    </>
  );
};

export default PasswordReset;
