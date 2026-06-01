import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

interface ApiResponse<T> {
  data: T;
  message: string;
}

export const useUsers = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ✅ Wrap in useCallback
  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<any[]>>('/admin/users');
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []); // ✅ Empty dependency array

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!isMounted) return;
      await fetchUsers();
    };
    
    load();

    return () => {
      isMounted = false;
    };
  }, [fetchUsers]); // ✅ Add fetchUsers as dependency

  return { data, isLoading, error };
};

export const useRoles = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<any[]>>('/admin/roles');
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!isMounted) return;
      await fetchRoles();
    };
    
    load();

    return () => {
      isMounted = false;
    };
  }, [fetchRoles]);

  return { data, isLoading, error };
};

export const usePermissions = () => {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPermissions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<ApiResponse<any[]>>('/admin/permissions');
      setData(response.data.data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const load = async () => {
      if (!isMounted) return;
      await fetchPermissions();
    };
    
    load();

    return () => {
      isMounted = false;
    };
  }, [fetchPermissions]);

  return { data, isLoading, error };
};
