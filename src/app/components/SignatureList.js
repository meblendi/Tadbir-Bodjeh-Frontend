"use client";
import { fetcher } from "@/app/fetcher";
import { toGregorian } from 'jalaali-js';
import { useEffect, useState } from 'react';

export default function SignatureList({
  date,
  role = 'president' // default role
}) {
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);

 
useEffect(() => {
    const fetchSignatures = async () => {
      try {
        const response = await fetcher("/api/sign/");        
        setSignatures(response.results || []);
      } catch (error) {
        console.error("Error fetching signatures:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSignatures();
  }, []);

  const jalaliToTimestamp = (jalaliDate) => {
    try {
      const [year, month, day] = jalaliDate.split('/').map(Number);
      const gregorian = toGregorian(year, month, day);
      return new Date(gregorian.gy, gregorian.gm - 1, gregorian.gd).getTime();
    } catch (e) {
      console.error("Invalid Jalali date:", jalaliDate);
      return 0;
    }
  };

  const getNameForRole = () => {
    if (!date) return 'تاریخ مشخص نشده است';
    if (loading) return 'در حال دریافت اطلاعات...';

    try {
      // Validate date format
      if (!/^\d{4}\/\d{2}\/\d{2}$/.test(date)) {
        return 'فرمت تاریخ نادرست است (باید YYYY/MM/DD باشد)';
      }

      const dateTimestamp = jalaliToTimestamp(date);
      if (dateTimestamp === 0) return 'تاریخ نامعتبر است';

      const roleSignatures = signatures.filter(sig => sig.role === role);
      if (roleSignatures.length === 0) return 'هیچ امضایی برای این سمت یافت نشد';

      for (const signature of roleSignatures) {
        const startTimestamp = jalaliToTimestamp(signature.date_start);
        const endTimestamp = signature.date_end 
          ? jalaliToTimestamp(signature.date_end) 
          : Infinity;

        if (dateTimestamp >= startTimestamp && dateTimestamp <= endTimestamp) {
          // Check if name needs "دکتر" prefix
          const prefix = signature.needs_title_prefix ? "دکتر " : "";
          return `${prefix}${signature.name} ${signature.last_name}`;
        }
      }

      return 'هیچ امضایی برای این تاریخ یافت نشد';
    } catch (e) {
      console.error('Error:', e);
      return 'خطا در پردازش اطلاعات';
    }
  };

  return <>{getNameForRole()}</>;
}