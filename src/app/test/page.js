"use client";
import { useEffect } from "react";
import SignatureList from "@/app/components/SignatureList";

export default function Page() {
    useEffect(() => {
        console.log("test");
    }, []);
    return <><div className="text-black text-xl">Test Page</div>
        <div className={"text-black text-center text-xl"}>
            <p className={"text-center"}>صدور حواله</p>
            <p className={"text-center no-wrap"}><SignatureList date="1404/02/15" role="financialAssistant" /></p>
            <p className={"text-center"}>مدیر امور مالی</p>
            <p className={"text-center"}><SignatureList date="1404/02/15" role="financialManager" /></p>
            <p className={"text-center"}>معاون اداری، عمرانی و مالی</p>
            <p className={"text-center"}><SignatureList date="1404/02/15" role="director" /></p>
            <p className={""}>رئیس دانشگاه</p>
            <SignatureList date="1404/02/15" role="president" />
        </div></>
}