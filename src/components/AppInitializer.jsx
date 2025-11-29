"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import useStore from "@/store/useStore";
import { getMockTabsResponse, mockUserData } from "@/lib/constants";
import useFrontOfficeStore from "@/store/useFrontOfficeStore";

const AppInitializer = () => {
  const searchParam = useSearchParams();
  const {
    setDashboardId,
    setConfigs,
    fetchUser,
    setUser,
    fetchTabsListForDashboard,
    getWorkspaceCollections,
  
  } = useStore();


  const getUser = async () => {
    //  setUser(mockUserData); // Simulated user data
    fetchUser();
  };

  



  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH_URL}/config.json`)
      .then((res) => res.json())
      .then((data) => {
        console.log(data, 'from configs')
        setConfigs(data);
      })
      .then(() => {
        getUser();
        fetchTabsListForDashboard();
        getWorkspaceCollections()
      })
      .catch((err) => {
        console.error("Failed to load config.json:", err);
      });
  }, []);

  useEffect(() => {
    const id = searchParam.get("id");
    if (id) {
      setDashboardId(id);
    }
  }, [searchParam, setDashboardId]);

  return null;
};

export default AppInitializer;
