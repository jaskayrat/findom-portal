import React, { useState, useEffect, useCallback, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

// --- Конфигурация Firebase ---
// ВАЖНО: Ключи API и конфигурация должны храниться в переменных окружения, а не в коде.
// Это демонстрационный пример.
const firebaseConfig = {
  apiKey: "AIzaSyB5xLruqvWe5_Q9np5WMXNUdtdptKIU_Fs", // ЗАМЕНИТЕ НА ВАШ КЛЮЧ
  authDomain: "findom-portal.firebaseapp.com",
  projectId: "findom-portal",
  storageBucket: "findom-portal.appspot.com",
  messagingSenderId: "1083919975913",
  appId: "1:1083919975913:web:384d47b5ae785aeef7b5a0"
};

// --- Инициализация Firebase ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- ДАННЫЕ ИЗ СТАРОГО САЙТА (Теперь как константы) ---
const knowledgeBaseData = {
    intro: { title: "Введение", icon: 'M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z', content: `<h2>Добро пожаловать в FinDom Helper!</h2><p>Этот портал — наша единая база знаний. Здесь собрана вся необходимая информация для успешной работы: от сведений о компании и продуктах до рабочих скриптов, инструкций и тестов. Наша цель — помочь вам быстро освоиться, чувствовать себя уверенно и эффективно выполнять свои задачи.</p><h3>О нас и Aventus Group</h3><p><strong>Findom.kz</strong> — это современный онлайн-сервис микрокредитования, который является частью крупной международной финансовой группы <strong>Aventus Group</strong>. Мы работаем на всей территории Республики Казахстан.</p><p>Наша миссия — предоставить клиентам быстрый, удобный и прозрачный доступ к финансовым средствам. Мы помогаем решать финансовые вопросы за несколько минут, без лишних документов, залогов, поручителей и необходимости посещать офис.</p>` },
    privacy: { title: "Политика ПДн", icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z', content: `<h2>Политика обработки персональных данных (ПДн)</h2><p>Защита персональных данных клиентов — наш главный приоритет и юридическая обязанность. Несоблюдение правил работы с конфиденциальной информацией может нанести ущерб как клиенту, так и репутации компании, и влечет за собой строгую ответственность.</p><h3>Что категорически ЗАПРЕЩЕНО</h3><ol><li><strong>Делать фото, видео или скриншоты экрана</strong>, содержащие любые личные данные клиента.</li><li><strong>Записывать персональные данные</strong> клиентов на бумажные носители, в личные телефоны или текстовые файлы.</li><li><strong>Передавать любую информацию о клиентах</strong> через неофициальные каналы: личные мессенджеры, личную электронную почту, SMS.</li><li><strong>Оставлять на экране компьютера открытую информацию</strong> о клиенте, уходя с рабочего места (всегда блокируйте ПК: Win+L).</li></ol>` },
    telemarketing: { title: "Телемаркетинг", icon: 'M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z', content: `<h2>Телемаркетинг (ТМ)</h2><p>Отдел телемаркетинга (ТМ) — это проактивное подразделение, которое работает с исходящими звонками. Его главная цель — увеличение конверсии и привлечение клиентов путем активного взаимодействия с теми, кто начал, но не завершил регистрацию на сайте, а также с повторными клиентами.</p><h3>Этапы звонка (Скрипт)</h3><ol><li><strong>Приветствие и представление:</strong> "Добрый день, [Имя клиента]! Меня зовут [Ваше имя], компания FinDom. Звоню по поводу вашей заявки на сайте, удобно говорить?"</li><li><strong>Выявление причины остановки:</strong> "Вижу, вы начали оформление у нас на сайте. Подскажите, на каком этапе возникли трудности?"</li><li><strong>Работа с возражениями ("Я подумаю"):</strong> "Конечно, решение за вами. Могу я уточнить, какая информация вам нужна для принятия решения? Возможно, я смогу ответить на ваши вопросы прямо сейчас, чтобы сэкономить ваше время."</li></ol>` }
};

// --- Тесты из старого сайта ---
const quizData = {
    telemarketing: {
        title: "Тест «Телемаркетинг»",
        description: "Этот тест проверит ваше знание техник продаж, работы с возражениями и ключевых показателей эффективности в отделе телемаркетинга.",
        questions: [
            { question: "Какая основная цель специалиста отдела телемаркетинга?", options: ["Просто напомнить о компании", "Собрать как можно больше данных о клиенте", "Помочь клиенту успешно оформить микрокредит (продать услугу)", "Проконсультировать по условиям погашения"], answer: "Помочь клиенту успешно оформить микрокредит (продать услугу)", explanation: "Главная задача ТМ — активные продажи и доведение клиента до получения микрокредита." },
            { question: "Вы звоните клиенту, который начал, но не закончил регистрацию. Каков ваш первый вопрос после приветствия и представления?", options: ["Почему вы не закончили?", "Какая сумма вам нужна?", "Вижу, вы начали оформление у нас на сайте. Подскажите, на каком этапе возникли трудности?", "У нас сейчас акция, хотите узнать?"], answer: "Вижу, вы начали оформление у нас на сайте. Подскажите, на каком этапе возникли трудности?", explanation: "Этот вопрос помогает сразу выявить проблему и предложить ее решение, показывая заботу о клиенте." },
        ]
    },
    precollection: {
        title: "Тест «Преколлекшн»",
        description: "Этот тест поможет проверить ваши знания по работе с клиентами до и во время краткосрочной просрочки, а также ваше умение продавать услугу отсрочки.",
        questions: [
             { question: "Какая главная философия и основная задача отдела Преколлекшн?", options: ["Требовать погашения долга любой ценой", "Продавать услугу отсрочки, чтобы помочь клиенту избежать просрочки", "Передавать дела клиентов в отдел взыскания", "Просто информировать о наличии задолженности"], answer: "Продавать услугу отсрочки, чтобы помочь клиенту избежать просрочки", explanation: "Основная цель Преколлекшн — не взыскание, а сервисная продажа решения, которое выгодно и клиенту, и компании." },
             { question: "С какой категорией клиентов работает отдел Преколлекшн?", options: ["Только с клиентами, у которых просрочка более 30 дней", "С клиентами за 3 дня до даты оплаты и до 3 дней после даты оплаты (+3 до -3)", "Со всеми клиентами, подавшими заявку", "Только с новыми клиентами"], answer: "С клиентами за 3 дня до даты оплаты и до 3 дней после даты оплаты (+3 до -3)", explanation: "Фокус отдела — работа на опережение и с самой ранней просрочкой, чтобы не доводить до серьезных проблем." },
        ]
    },
     security: {
        title: "Тест по безопасности",
        description: "Этот тест проверяет знание ключевых правил безопасности, трудовой дисциплины и политики конфиденциальности компании.",
        questions: [
            { question: "Какое из следующих действий является грубым нарушением политики конфиденциальности?", options: ["Поставить звонок на удержание для уточнения информации", "Сделать скриншот профиля клиента с его личными данными", "Предложить клиенту услугу отсрочки", "Оставить комментарий о звонке в Agis"], answer: "Сделать скриншот профиля клиента с его личными данными", explanation: "Создание любых копий (скриншотов, фото) экрана с данными клиента категорически запрещено." },
            { question: "Ваш друг просит 'пробить' по базе своего знакомого. Ваши действия?", options: ["Помочь другу, так как он попросил", "Сказать, что у вас нет доступа к базе", "Вежливо отказать, объяснив, что это строго конфиденциальная информация и ее разглашение запрещено", "Сделать это после рабочего дня, чтобы никто не увидел"], answer: "Вежливо отказать, объяснив, что это строго конфиденциальная информация и ее разглашение запрещено", explanation: "Доступ к данным клиентов разрешен только в рамках выполнения прямых должностных обязанностей." },
        ]
    },
};


// --- Общие компоненты ---
const Icon = ({ path, className = "w-6 h-6" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d={path} /></svg>);

function CircularProgressBar({ value, text, pathColor, textColor, trailColor, textSize }) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;
    return (<div className="w-[150px] h-[150px] relative"><svg width="150" height="150" viewBox="0 0 100 100"><circle cx="50" cy="50" r={radius} stroke={trailColor || "#d6d6d6"} strokeWidth="10" fill="transparent" /><motion.circle cx="50" cy="50" r={radius} stroke={pathColor || "#4a90e2"} strokeWidth="10" fill="transparent" strokeDasharray={circumference} strokeLinecap="round" transform="rotate(-90 50 50)" initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1, ease: "easeInOut" }} /></svg><div className={`absolute top-0 left-0 w-full h-full flex items-center justify-center text-[${textSize || '24px'}] font-bold`} style={{color: textColor || '#333'}}>{text}</div></div>);
}

// --- Логика ИИ ---
async function callAI(messages) {
    // ЗАМЕНИТЕ НА ВАШ URL ДЛЯ ОБРАЩЕНИЯ К API
    const WORKER_URL = "https://findom.meetlle2004.workers.dev/"; 
    try {
        const response = await fetch(WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages })
        });
        if (!response.ok) throw new Error(`Worker Error: ${response.status}`);
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("AI API Error:", error);
        return "Произошла ошибка при обращении к ИИ. Пожалуйста, проверьте консоль и настройки API.";
    }
}


// --- Страницы ---

function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleAuthAction = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await setDoc(doc(db, "users", user.uid), {
                    email: user.email, role: "employee", displayName: user.email.split('@')[0],
                    avatarUrl: `https://ui-avatars.com/api/?name=${user.email[0]}&background=random&color=fff&size=128`,
                    assistantName: "Помощник", level: 1, xp: 0,
                    kpi: { sales: 50 + Math.floor(Math.random() * 50), quality: 50 + Math.floor(Math.random() * 50), proactivity: 50 + Math.floor(Math.random() * 50) },
                    bio: "Расскажите немного о себе...", achievements: []
                });
            }
        } catch (err) { setError(getFriendlyErrorMessage(err.code)); } finally { setLoading(false); }
    };
    const getFriendlyErrorMessage = (code) => {
        switch (code) {
            case 'auth/invalid-email': return 'Неверный формат электронной почты.'; case 'auth/user-not-found': return 'Пользователь с таким email не найден.';
            case 'auth/wrong-password': return 'Неверный пароль.'; case 'auth/email-already-in-use': return 'Этот email уже используется.';
            case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).'; default: return 'Произошла ошибка. Попробуйте снова.';
        }
    };
    return (<div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-lighten filter blur-xl opacity-40 animate-blob"></div><div className="absolute top-0 -right-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-lighten filter blur-xl opacity-40 animate-blob animation-delay-2000"></div><div className="absolute -bottom-8 left-20 w-72 h-72 bg-green-600 rounded-full mix-blend-lighten filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
        <div className="w-full max-w-md z-10"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-gray-800 bg-opacity-60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-gray-700">
            <div className="text-center mb-8"><h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">FinDom Portal</h1><p className="text-gray-400 mt-2">Ваш ключ к успеху и развитию</p></div>
            <form onSubmit={handleAuthAction}><div className="space-y-6"><div className="relative"><Icon path="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-700 bg-opacity-50 text-white placeholder-gray-400 pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300" required /></div><div className="relative"><Icon path="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-700 bg-opacity-50 text-white placeholder-gray-400 pl-10 pr-4 py-3 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300" required /></div></div>
                {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
                <button type="submit" disabled={loading} className="w-full mt-8 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">{loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Создать аккаунт')}</button>
            </form>
            <p className="text-center text-sm text-gray-400 mt-6">{isLogin ? 'Нет аккаунта?' : 'Уже есть аккаунт?'} <button onClick={() => setIsLogin(!isLogin)} className="font-semibold text-green-400 hover:text-green-300 ml-1 focus:outline-none">{isLogin ? 'Зарегистрироваться' : 'Войти'}</button></p>
        </motion.div></div>
    </div>);
}

function Sidebar({ user, userData, activeView, setActiveView }) {
    const handleLogout = async () => { await signOut(auth); };
    const xpToNextLevel = (userData?.level || 1) * 100;
    const xpProgress = ((userData?.xp || 0) / xpToNextLevel) * 100;
    
    const navItems = [
        { id: 'profile', label: 'Мой профиль', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
        { id: 'kpi', label: 'Мои KPI', icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z' },
        { id: 'leaderboard', label: 'Доска лидеров', icon: 'M16.5 18.75h-9a9 9 0 11-6.146-2.919L2.11 15.63a.75.75 0 01-.42-1.063l1.157-2.313a.75.75 0 011.063-.42l1.29 1.29a.75.75 0 01-.318 1.284l-1.059.426a7.5 7.5 0 1011.082-2.872l.247-.552a.75.75 0 011.132-.47l1.24 1.123a.75.75 0 01.062 1.062l-1.665 1.831a.75.75 0 01-1.082.049l-1.072-1.072a.75.75 0 01.214-1.185l.879-.527a.75.75 0 01.917.814l-.323 1.292a.75.75 0 01-.93.659l-.752-.188a.75.75 0 01-.622-.892l.333-1.332a.75.75 0 01.916-.664l1.18.295a.75.75 0 01.594.814l-1.025 4.1a.75.75 0 01-.93.659H16.5A.75.75 0 0115 21a.75.75 0 01-.75-.75v-1.5a.75.75 0 01.75-.75z' },
        { id: 'knowledge', label: 'База знаний', icon: 'M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25' },
        { id: 'tests', label: 'Тесты', icon: 'M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        { id: 'ai_trainer', label: 'ИИ-Тренажер', icon: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z' },
        { id: 'ai_scenarist', label: 'ИИ-Сценарист', icon: 'M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125' },
        { id: 'best_calls', label: 'Лучшие звонки', icon: 'M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z' },
    ];

    if (userData?.role === 'manager' || userData?.role === 'developer') { navItems.push({ id: 'admin', label: 'Админ-панель', icon: 'M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75' }); }
    
    return (<div className="w-72 bg-gray-900 text-gray-200 flex flex-col p-4 space-y-4">
            <div className="flex flex-col items-center text-center p-4 border-b border-gray-700">
                <motion.img src={userData?.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full mb-4 border-4 border-gray-700 shadow-lg" whileHover={{ scale: 1.1, rotate: 5 }}/>
                <h2 className="text-xl font-bold text-white">{userData?.displayName}</h2><p className="text-sm text-gray-400">{userData?.role}</p>
                <div className="w-full mt-4"><div className="flex justify-between text-xs text-gray-400 mb-1"><span>Уровень {userData?.level || 1}</span><span>{userData?.xp || 0} / {xpToNextLevel} XP</span></div><div className="w-full bg-gray-700 rounded-full h-2.5"><motion.div className="bg-gradient-to-r from-green-400 to-blue-500 h-2.5 rounded-full" initial={{ width: 0 }} animate={{ width: `${xpProgress}%`}} transition={{ duration: 0.5, ease: "easeOut" }}/></div></div>
            </div>
            <nav className="flex-grow"><ul className="space-y-2">{navItems.map(item => (<li key={item.id}><a href="#" onClick={() => setActiveView(item.id)} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${activeView === item.id ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-gray-800'}`}><Icon path={item.icon} className="w-6 h-6" /><span className="font-semibold">{item.label}</span></a></li>))}</ul></nav>
            <div><button onClick={handleLogout} className="flex items-center space-x-3 p-3 rounded-lg w-full text-left hover:bg-red-800 transition-all duration-200"><Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m-3-6l-3-3m0 0l3-3m-3 3h12.75" /><span className="font-semibold">Выйти</span></button></div>
        </div>);
}

function ProfilePage({ user, userData, setUserData }) {
    const [isEditMode, setIsEditMode] = useState(false);
    const [displayName, setDisplayName] = useState(userData?.displayName || '');
    const [bio, setBio] = useState(userData?.bio || '');
    const [assistantName, setAssistantName] = useState(userData?.assistantName || 'Помощник');
    const [avatarFile, setAvatarFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const achievementsList = [
        { id: 'sales_master', title: 'Мастер Продаж', description: 'Выполнить план продаж на 100%+', icon: '🔥', condition: (kpi) => kpi.sales >= 100 },
        { id: 'quality_guru', title: 'Гуру Качества', description: 'Достичь оценки качества 95%+', icon: '⭐', condition: (kpi) => kpi.quality >= 95 },
        { id: 'proactive_hero', title: 'Герой Проактивности', description: 'Показатель проактивности 90%+', icon: '🚀', condition: (kpi) => kpi.proactivity >= 90 },
    ];
    const userAchievements = achievementsList.filter(ach => ach.condition(userData?.kpi || {}));
    const handleSave = async () => {
        if (!user) return; setLoading(true); const userDocRef = doc(db, "users", user.uid); let newAvatarUrl = userData.avatarUrl;
        if (avatarFile) { const storageRef = ref(storage, `avatars/${user.uid}`); await uploadBytes(storageRef, avatarFile); newAvatarUrl = await getDownloadURL(storageRef); }
        const updatedData = { displayName, bio, assistantName, avatarUrl: newAvatarUrl, };
        await updateDoc(userDocRef, updatedData); setUserData(prevData => ({ ...prevData, ...updatedData }));
        setLoading(false); setIsEditMode(false); setAvatarFile(null);
    };
    const handleAvatarChange = (e) => { if (e.target.files[0]) { setAvatarFile(e.target.files[0]); } }
    return (<div className="p-8"><motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center justify-between mb-6"><h1 className="text-3xl font-bold text-gray-800">Мой профиль</h1>
            {!isEditMode ? ( <button onClick={() => setIsEditMode(true)} className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"> <Icon path="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" className="w-5 h-5" /> <span>Редактировать</span> </button> ) : ( <div className="flex space-x-2"> <button onClick={() => setIsEditMode(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Отмена</button> <button onClick={handleSave} disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"> {loading ? 'Сохранение...' : 'Сохранить'} </button> </div> )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center"><div className="flex flex-col items-center"> <img src={avatarFile ? URL.createObjectURL(avatarFile) : userData?.avatarUrl} alt="Avatar" className="w-40 h-40 rounded-full mb-4 border-4 border-gray-200 shadow-md object-cover"/> {isEditMode && ( <div className="relative"> <input type="file" id="avatarUpload" className="hidden" accept="image/*" onChange={handleAvatarChange} /> <label htmlFor="avatarUpload" className="cursor-pointer bg-gray-800 text-white text-sm py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">Сменить фото</label> </div> )} </div>
            <div className="md:col-span-2 space-y-4">
                <div> <label className="text-sm font-bold text-gray-500">Имя и Фамилия</label> {isEditMode ? ( <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full p-2 mt-1 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"/> ) : ( <p className="text-2xl text-gray-800">{userData?.displayName}</p> )} </div>
                <div> <label className="text-sm font-bold text-gray-500">Email</label> <p className="text-xl text-gray-600">{userData?.email}</p> </div>
                <div> <label className="text-sm font-bold text-gray-500">О себе</label> {isEditMode ? ( <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-2 mt-1 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" rows="3"></textarea> ) : ( <p className="text-xl text-gray-800 italic">{userData?.bio}</p> )} </div>
                <div> <label className="text-sm font-bold text-gray-500">Имя для ИИ-помощника</label> {isEditMode ? ( <input type="text" value={assistantName} onChange={(e) => setAssistantName(e.target.value)} className="w-full p-2 mt-1 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"/> ) : ( <p className="text-xl text-gray-800">{userData?.assistantName}</p> )} </div>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t"><h2 className="text-2xl font-bold text-gray-800 mb-4">Мои достижения</h2>
            {userAchievements.length > 0 ? (<div className="flex flex-wrap gap-4">{userAchievements.map(ach => (<motion.div key={ach.id} whileHover={{ scale: 1.05 }} className="flex items-center bg-yellow-100 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm"><span className="text-3xl mr-4">{ach.icon}</span><div><h3 className="font-bold text-yellow-800">{ach.title}</h3><p className="text-sm text-yellow-700">{ach.description}</p></div></motion.div>))}</div>) : (<p className="text-gray-500">Ваши первые достижения уже ждут вас! Покажите лучший результат!</p>)}
        </div>
    </motion.div></div>);
}

function KpiPage({ userData }) {
    const kpiData = userData?.kpi || { sales: 0, quality: 0, proactivity: 0 };
    return(<div className="p-8"><motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-gray-800 mb-8">Мои показатели (KPI)</motion.h1><motion.div className="grid grid-cols-1 md:grid-cols-3 gap-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }}>
        {[ { title: "План продаж", value: kpiData.sales, color: "#4a90e2" }, { title: "Качество (QC)", value: kpiData.quality, color: "#50e3c2" }, { title: "Проактивность", value: kpiData.proactivity, color: "#8b5cf6" } ].map((item, index) => (<motion.div key={item.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1}} className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center justify-center"><h2 className="text-xl font-bold text-gray-600 mb-4">{item.title}</h2><CircularProgressBar value={item.value} text={`${item.value}%`} pathColor={item.color} textColor="#333" trailColor="#e5e7eb" textSize="24px" /></motion.div>))}
    </motion.div></div>);
}

function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { const fetchUsers = async () => { setLoading(true); const usersRef = collection(db, "users"); const q = query(usersRef); const querySnapshot = await getDocs(q); const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); usersList.forEach(user => { const kpi = user.kpi || { sales: 0, quality: 0 }; user.score = (user.xp || 0) + (kpi.sales * 10) + (kpi.quality * 5); }); usersList.sort((a, b) => b.score - a.score); setUsers(usersList); setLoading(false); }; fetchUsers(); }, []);
    if (loading) return <div className="p-8"><p>Загрузка лидеров...</p></div>
    return (<div className="p-8"><h1 className="text-3xl font-bold text-gray-800 mb-8">Доска лидеров</h1><div className="bg-white rounded-2xl shadow-lg overflow-hidden"><ul className="divide-y divide-gray-200">{users.map((user, index) => (<motion.li key={user.id} className="p-4 flex items-center justify-between" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}><div className="flex items-center"><span className={`text-2xl font-bold w-10 text-center ${index < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>{index + 1}</span><img src={user.avatarUrl} alt={user.displayName} className="w-12 h-12 rounded-full ml-4 mr-4 object-cover" /><div><p className="font-bold text-gray-800">{user.displayName}</p><p className="text-sm text-gray-500">Уровень {user.level}</p></div></div><div className="text-right"><p className="font-bold text-lg text-blue-600">{Math.round(user.score)} очков</p><p className="text-sm text-gray-500">{user.xp} XP</p></div></motion.li>))}</ul></div></div>);
}

function KnowledgeBasePage() {
    const [activeArticle, setActiveArticle] = useState(Object.keys(knowledgeBaseData)[0]);
    return (<div className="p-8 flex flex-col md:flex-row gap-8"><aside className="w-full md:w-1/4"><h2 className="text-2xl font-bold text-gray-800 mb-4">Разделы</h2><ul className="space-y-2">{Object.entries(knowledgeBaseData).map(([key, {title, icon}]) => (<li key={key}><a href="#" onClick={(e) => { e.preventDefault(); setActiveArticle(key); }} className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-200 ${activeArticle === key ? 'bg-blue-500 text-white shadow-md' : 'bg-white hover:bg-gray-50'}`}><Icon path={icon} className="w-6 h-6" /><span className="font-semibold">{title}</span></a></li>))}</ul></aside><motion.div key={activeArticle} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full md:w-3/4 bg-white rounded-2xl shadow-lg p-8 prose max-w-none"><div dangerouslySetInnerHTML={{ __html: knowledgeBaseData[activeArticle].content }} /></motion.div></div>);
}

function BestCallsPage() {
    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => { const fetchCalls = async () => { setLoading(true); const callsRef = collection(db, "best_calls"); const q = query(callsRef, orderBy("timestamp", "desc")); const querySnapshot = await getDocs(q); const callsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })); setCalls(callsList); setLoading(false); }; fetchCalls(); }, []);
    if (loading) return <div className="p-8"><p>Загрузка звонков...</p></div>
    return (<div className="p-8"><h1 className="text-3xl font-bold text-gray-800 mb-8">Лучшие звонки</h1><div className="space-y-6">{calls.map(call => (<motion.div key={call.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-lg"><h2 className="text-xl font-bold text-gray-700 mb-2">{call.title}</h2><p className="text-gray-500 mb-4">{call.description}</p><audio controls src={call.audioUrl} className="w-full">Your browser does not support the audio element.</audio></motion.div>))}</div></div>);
}

function AdminPage() {
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [callTitle, setCallTitle] = useState('');
    const [callDescription, setCallDescription] = useState('');
    const [callFile, setCallFile] = useState(null);
    const handleKpiUpload = (event) => {
        setLoading(true); setMessage(''); const file = event.target.files[0]; const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0]; const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                if (json.length === 0) { setMessage('Ошибка: Excel-файл пуст или имеет неверный формат.'); setLoading(false); return; }
                for (const row of json) {
                    const email = row.email; if (!email) continue;
                    const usersRef = collection(db, "users"); const q = query(usersRef, where("email", "==", email));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        await updateDoc(userDoc.ref, {
                            kpi: { sales: row.sales || 0, quality: row.quality || 0, proactivity: row.proactivity || 0 },
                            xp: (userDoc.data().xp || 0) + (row.xp || 0)
                        });
                    }
                }
                setMessage(`Успешно обновлено ${json.length} записей!`);
            } catch (error) { setMessage('Произошла ошибка при чтении файла.'); console.error(error); } finally { setLoading(false); }
        };
        reader.readAsArrayBuffer(file);
    };
    const handleCallUpload = async (e) => {
        e.preventDefault(); if (!callFile || !callTitle) { setMessage('Заполните заголовок и выберите аудиофайл.'); return; }
        setLoading(true); setMessage('');
        try {
            const storageRef = ref(storage, `best_calls/${Date.now()}_${callFile.name}`); await uploadBytes(storageRef, callFile);
            const audioUrl = await getDownloadURL(storageRef);
            await addDoc(collection(db, "best_calls"), { title: callTitle, description: callDescription, audioUrl: audioUrl, timestamp: serverTimestamp() });
            setMessage('Лучший звонок успешно загружен!'); setCallTitle(''); setCallDescription(''); setCallFile(null); e.target.reset();
        } catch (error) { setMessage('Ошибка при загрузке звонка.'); console.error(error); } finally { setLoading(false); }
    };
    return(<div className="p-8 space-y-8"><h1 className="text-3xl font-bold text-gray-800">Админ-панель</h1><div className="bg-white p-6 rounded-2xl shadow-lg"><h2 className="text-xl font-bold text-gray-600 mb-4">Загрузка отчета KPI</h2><p className="text-gray-500 mb-4"> Выберите Excel-файл для обновления данных сотрудников. Файл должен содержать столбцы: <code className="bg-gray-200 p-1 rounded mx-1">email</code>, <code className="bg-gray-200 p-1 rounded mx-1">sales</code>, <code className="bg-gray-200 p-1 rounded mx-1">quality</code>, <code className="bg-gray-200 p-1 rounded mx-1">proactivity</code>, <code className="bg-gray-200 p-1 rounded mx-1">xp</code>. </p><input type="file" accept=".xlsx, .xls" onChange={handleKpiUpload} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" /></div><div className="bg-white p-6 rounded-2xl shadow-lg"><h2 className="text-xl font-bold text-gray-600 mb-4">Загрузить лучший звонок</h2><form onSubmit={handleCallUpload} className="space-y-4"><input type="text" placeholder="Заголовок звонка" value={callTitle} onChange={(e) => setCallTitle(e.target.value)} className="w-full p-2 border-2 border-gray-200 rounded-lg" required /><textarea placeholder="Краткое описание" value={callDescription} onChange={(e) => setCallDescription(e.target.value)} className="w-full p-2 border-2 border-gray-200 rounded-lg" rows="2"></textarea><input type="file" accept="audio/*" onChange={(e) => setCallFile(e.target.files[0])} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" required /><button type="submit" disabled={loading} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Загрузить</button></form></div>{loading && <p className="text-blue-600 mt-4">Идет обработка...</p>}{message && <p className="text-green-600 mt-4">{message}</p>}</div>);
}

// --- НОВЫЕ СТРАНИЦЫ И КОМПОНЕНТЫ ---

function TestsPage() {
    const [selectedQuizId, setSelectedQuizId] = useState(null);

    if (selectedQuizId) {
        return <QuizComponent quizId={selectedQuizId} onBack={() => setSelectedQuizId(null)} />;
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Центр Обучения и Тестирования</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(quizData).map(([id, { title, description }]) => (
                    <motion.div
                        key={id}
                        onClick={() => setSelectedQuizId(id)}
                        className="bg-white p-6 rounded-2xl shadow-lg cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all"
                        whileHover={{ scale: 1.03 }}
                    >
                        <h2 className="text-xl font-bold text-gray-700 mb-2">{title}</h2>
                        <p className="text-gray-500">{description}</p>
                        <button className="mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded-lg w-full hover:bg-blue-600 transition-colors">
                            Начать тест
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function QuizComponent({ quizId, onBack }) {
    const quiz = quizData[quizId];
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState(new Array(quiz.questions.length).fill(null));
    const [showResults, setShowResults] = useState(false);

    const handleSelectAnswer = (option) => {
        const newAnswers = [...userAnswers];
        newAnswers[currentQuestionIndex] = option;
        setUserAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            setShowResults(true);
        }
    };
    
    const restartQuiz = () => {
        setCurrentQuestionIndex(0);
        setUserAnswers(new Array(quiz.questions.length).fill(null));
        setShowResults(false);
    }

    if (showResults) {
        const score = userAnswers.reduce((acc, answer, i) => acc + (answer === quiz.questions[i].answer ? 1 : 0), 0);
        const percentage = Math.round((score / quiz.questions.length) * 100);
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Результаты: {quiz.title}</h1>
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
                    <h2 className="text-2xl font-bold">Ваш результат: {score} из {quiz.questions.length} ({percentage}%)</h2>
                    <div className="my-6">
                        <CircularProgressBar value={percentage} text={`${percentage}%`} pathColor={percentage > 70 ? "#50e3c2" : "#f5a623"} />
                    </div>
                    <button onClick={restartQuiz} className="bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors mr-4">Попробовать снова</button>
                    <button onClick={onBack} className="bg-gray-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors">К списку тестов</button>
                </div>
                <div className="mt-8 space-y-4">
                    {quiz.questions.map((q, i) => (
                        <div key={i} className={`p-4 rounded-lg ${userAnswers[i] === q.answer ? 'bg-green-100 border-green-400' : 'bg-red-100 border-red-400'} border-l-4`}>
                            <p className="font-bold">{i + 1}. {q.question}</p>
                            <p className={`mt-2 ${userAnswers[i] === q.answer ? 'text-green-800' : 'text-red-800'}`}>Ваш ответ: {userAnswers[i] || "Нет ответа"}</p>
                            {userAnswers[i] !== q.answer && <p className="text-green-800">Правильный ответ: {q.answer}</p>}
                            <p className="text-sm text-gray-600 mt-1 italic">Пояснение: {q.explanation}</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const question = quiz.questions[currentQuestionIndex];
    const progress = (currentQuestionIndex / quiz.questions.length) * 100;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <button onClick={onBack} className="text-blue-500 hover:underline mb-4">&larr; К списку тестов</button>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
            <p className="text-gray-500 mb-6">Вопрос {currentQuestionIndex + 1} из {quiz.questions.length}</p>
            
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-8">
                <motion.div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${progress}%` }} />
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-lg">
                <h2 className="text-2xl font-semibold mb-6">{question.question}</h2>
                <div className="space-y-3">
                    {question.options.map((option, i) => (
                        <button
                            key={i}
                            onClick={() => handleSelectAnswer(option)}
                            className={`block w-full text-left p-4 rounded-lg border-2 transition-all ${userAnswers[currentQuestionIndex] === option ? 'bg-blue-500 border-blue-500 text-white' : 'bg-gray-50 hover:bg-gray-100 border-gray-200'}`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <div className="mt-8 text-right">
                    <button onClick={handleNext} disabled={!userAnswers[currentQuestionIndex]} className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                        {currentQuestionIndex < quiz.questions.length - 1 ? 'Далее' : 'Завершить'}
                    </button>
                </div>
            </div>
        </div>
    );
}

function AiTrainerPage() {
    // This is a simplified version. A full implementation would require more complex state management.
    const [step, setStep] = useState(1);
    const [selections, setSelections] = useState({ department: '', clientType: '', irritability: 3 });
    const [chatHistory, setChatHistory] = useState([]);
    const [isAiTyping, setIsAiTyping] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const userInput = e.target.elements.userInput.value.trim();
        if (!userInput) return;

        const newHistory = [...chatHistory, { role: 'user', content: userInput }];
        setChatHistory(newHistory);
        e.target.reset();
        setIsAiTyping(true);

        // This is a mock AI response. In a real app, you'd call the AI API.
        const systemPrompt = `Ты - клиент. Ответь на реплику оператора: "${userInput}". Твой отдел: ${selections.department}, тип: ${selections.clientType}, настроение: ${selections.irritability}/5.`;
        const aiResponse = await callAI([{role: 'system', content: systemPrompt}, ...newHistory]);

        setChatHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsAiTyping(false);
    };
    
    const resetAndStart = () => {
        setStep(1);
        setChatHistory([]);
        setSelections({ department: '', clientType: '', irritability: 3 });
    }

    if (step === 4) { // Analysis step
         return (
            <div className="p-8 max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Анализ диалога</h1>
                 <div className="bg-white p-8 rounded-2xl shadow-lg">
                    <p className="text-gray-600 mb-4">ИИ-аналитик ОКК готовит отчет... (Это демо-версия. В реальном приложении здесь был бы подробный разбор диалога).</p>
                    <div className="bg-gray-100 p-4 rounded-lg text-gray-700">
                        <h3 className="font-bold">Итоговая оценка: 85%</h3>
                        <p className="mt-2"><strong>Ключевая ошибка:</strong> Оператор использовал закрытый вопрос, когда следовало задать открытый.</p>
                        <p className="mt-1"><strong>Успешный момент:</strong> Отличное присоединение к проблеме клиента в начале разговора.</p>
                    </div>
                     <button onClick={resetAndStart} className="mt-6 bg-blue-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors">Начать новую симуляцию</button>
                </div>
            </div>
        );
    }
    
    if (step === 3) { // Simulation step
        return (
            <div className="p-8 h-full flex flex-col">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">Симуляция звонка</h1>
                <div className="flex-grow bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                    <div ref={chatBodyRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
                        {chatHistory.map((msg, i) => (
                            <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">К</div>}
                                <div className={`max-w-lg p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 rounded-bl-none'}`}>
                                    {msg.content}
                                </div>
                                {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center font-bold text-white">О</div>}
                            </div>
                        ))}
                        {isAiTyping && <div className="flex items-end gap-2 justify-start"><div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center font-bold text-gray-600">К</div><div className="max-w-lg p-3 rounded-2xl bg-gray-200 text-gray-800 rounded-bl-none">...</div></div>}
                    </div>
                    <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 flex gap-4 items-center">
                        <input name="userInput" type="text" placeholder="Ваш ответ клиенту..." className="w-full p-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500" />
                        <button type="submit" className="bg-blue-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors">Отправить</button>
                    </form>
                </div>
                 <button onClick={() => setStep(4)} className="mt-4 bg-red-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-red-600 transition-colors self-center">Завершить и получить анализ</button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Настройка ИИ-Тренажера</h1>
            <div className="bg-white p-8 rounded-2xl shadow-lg space-y-8">
                {/* Step 1 */}
                <AnimatePresence>
                {step === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <h2 className="text-xl font-semibold mb-4">Шаг 1: Выберите отдел</h2>
                        <select onChange={(e) => setSelections({...selections, department: e.target.value})} defaultValue="" className="w-full p-3 border-2 border-gray-200 rounded-lg">
                            <option value="" disabled>-- Выберите --</option>
                            <option value="telemarketing">Телемаркетинг</option>
                            <option value="precollection">Преколлекшн</option>
                            <option value="inbound">Входящая линия</option>
                        </select>
                        <button onClick={() => setStep(2)} disabled={!selections.department} className="mt-4 w-full bg-blue-500 text-white font-bold py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300">Далее</button>
                    </motion.div>
                )}
                </AnimatePresence>
                {/* Step 2 */}
                <AnimatePresence>
                {step === 2 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                         <h2 className="text-xl font-semibold mb-4">Шаг 2: Настройте клиента</h2>
                         <div className="space-y-4">
                            <div>
                                <label className="font-semibold text-gray-600">Тип клиента</label>
                                <select onChange={(e) => setSelections({...selections, clientType: e.target.value})} defaultValue="" className="w-full p-3 border-2 border-gray-200 rounded-lg mt-1">
                                    <option value="" disabled>-- Выберите --</option>
                                    <option value="new">Новый</option>
                                    <option value="repeat">Повторный</option>
                                    <option value="complaint">С жалобой</option>
                                </select>
                            </div>
                            <div>
                                 <label className="font-semibold text-gray-600">Настроение клиента ({selections.irritability}/5)</label>
                                <input type="range" min="1" max="5" value={selections.irritability} onChange={(e) => setSelections({...selections, irritability: e.target.value})} className="w-full mt-2" />
                            </div>
                         </div>
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setStep(1)} className="w-full bg-gray-500 text-white font-bold py-3 rounded-lg hover:bg-gray-600 transition-colors">Назад</button>
                            <button onClick={() => setStep(3)} disabled={!selections.clientType} className="w-full bg-green-500 text-white font-bold py-3 rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-300">Начать симуляцию</button>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function AiScenaristPage() {
    const [history, setHistory] = useState([{ role: 'assistant', content: "Здравствуйте! Я — ваш ИИ-помощник по скриптам. Чем могу помочь сегодня?" }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatBodyRef = useRef(null);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [history]);

    const handleSend = async (promptText = null) => {
        const text = promptText || input;
        if (!text) return;

        const newHistory = [...history, { role: 'user', content: text }];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        const systemPrompt = `Ты — эксперт-наставник для сотрудников колл-центра МФО. Твоя задача — помогать операторам, создавая для них скрипты, обучая работе с возражениями и отвечая на их вопросы. Структурируй ответ, используй Markdown.`;
        const aiResponse = await callAI([{ role: 'system', content: systemPrompt }, ...newHistory]);

        setHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);
    };

    const quickPrompts = ["Как работать с возражением 'дорого'?", "Напиши скрипт для продажи отсрочки", "Как вежливо напомнить о долге?"];

    return (
        <div className="p-8 h-full flex flex-col">
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">ИИ-Сценарист</h1>
            <p className="text-gray-500 text-center mb-6">Ваш персональный помощник по созданию скриптов и отработке возражений.</p>
            <div className="flex-grow bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">
                <div ref={chatBodyRef} className="flex-grow p-6 space-y-4 overflow-y-auto">
                    {history.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                             {msg.role === 'assistant' && <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>}
                            <div className={`max-w-2xl p-4 rounded-2xl prose prose-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`} dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
                        </div>
                    ))}
                    {isLoading && <div className="flex items-start gap-3"><div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div><div className="p-4 rounded-2xl bg-gray-100">...</div></div>}
                </div>
                <div className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2 mb-2">
                        {quickPrompts.map(p => <button key={p} onClick={() => handleSend(p)} className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-300">{p}</button>)}
                    </div>
                    <div className="flex gap-4">
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} type="text" placeholder="Спросите что-нибудь..." className="w-full p-3 border-2 border-gray-200 rounded-lg" />
                        <button onClick={() => handleSend()} disabled={isLoading} className="bg-purple-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-600 disabled:bg-gray-300">Отправить</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function AiAssistant({ userData }) {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input) return;
        const newHistory = [...history, { role: 'user', content: input }];
        setHistory(newHistory);
        setInput('');
        setIsLoading(true);

        const systemPrompt = `Ты - ${userData?.assistantName || 'Помощник'}, дружелюбный ИИ-ассистент в портале FinDom. Отвечай кратко и по делу.`;
        const aiResponse = await callAI([{ role: 'system', content: systemPrompt }, ...newHistory]);

        setHistory(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        setIsLoading(false);
    };

    return (
        <>
            <div className="fixed bottom-6 right-6 z-50">
                <motion.button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center text-3xl"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                >
                   💬
                </motion.button>
            </div>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border"
                    >
                        <div className="p-4 bg-gray-50 border-b">
                            <h3 className="font-bold text-lg text-gray-800">{userData?.assistantName || 'ИИ-Помощник'}</h3>
                        </div>
                        <div className="flex-grow p-4 space-y-3 overflow-y-auto">
                             {history.map((msg, i) => (
                                <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs p-3 rounded-xl ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && <div className="p-3 rounded-xl bg-gray-200 text-gray-800 self-start">...</div>}
                        </div>
                        <div className="p-4 border-t bg-white flex gap-2">
                             <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} type="text" placeholder="Ваш вопрос..." className="w-full p-2 border-2 border-gray-200 rounded-lg" />
                             <button onClick={handleSend} disabled={isLoading} className="bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-600 disabled:bg-gray-300">Go</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// --- Основной компонент портала ---

function MainPortal({ user, userData, setUserData }) {
    const [currentView, setCurrentView] = useState('profile');
    const renderView = () => {
        switch (currentView) {
            case 'profile': return <ProfilePage user={user} userData={userData} setUserData={setUserData} />;
            case 'kpi': return <KpiPage userData={userData} />;
            case 'leaderboard': return <LeaderboardPage />;
            case 'knowledge': return <KnowledgeBasePage />;
            case 'tests': return <TestsPage />;
            case 'ai_trainer': return <AiTrainerPage />;
            case 'ai_scenarist': return <AiScenaristPage />;
            case 'best_calls': return <BestCallsPage />;
            case 'admin': if (userData?.role === 'manager' || userData?.role === 'developer') { return <AdminPage />; } return <ProfilePage user={user} userData={userData} setUserData={setUserData} />;
            default: return <ProfilePage user={user} userData={userData} setUserData={setUserData} />;
        }
    };
    return (<div className="flex h-screen bg-gray-100 font-sans">
        <Sidebar user={user} userData={userData} activeView={currentView} setActiveView={setCurrentView} />
        <main className="flex-1 overflow-y-auto relative">
            <AnimatePresence mode="wait">
                <motion.div key={currentView} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2 }} className="h-full">
                    {renderView()}
                </motion.div>
            </AnimatePresence>
            <AiAssistant userData={userData} />
        </main>
    </div>);
}

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) { setUserData(userDocSnap.data()); } else { setUserData(null); }
            } else { setUser(null); setUserData(null); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    const handleSetUserData = (data) => { setUserData(prev => ({...prev, ...data})); };
    if (loading) { return (<div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-green-500"></div></div>); }
    return user && userData ? <MainPortal user={user} userData={userData} setUserData={handleSetUserData} /> : <AuthPage />;
}

export default App;
