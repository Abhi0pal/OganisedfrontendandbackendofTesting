'use client';

import React from 'react';
import RegisterForm from './RegisterForm';
import JharkhandAssistant from '@/components/common/Floatingchat';

export default function RegisterPage() {
    return (
        <section className="auth-wrap">
            <div className="auth-box">
                <RegisterForm />
            
            </div>
        </section>
    );
}
