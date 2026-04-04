"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Lang = "pt-BR" | "en-US" | "es";

const TRANSLATIONS = {
  "pt-BR": {
    // Nav
    dashboard: "Dashboard", analyze: "Análise de Código", dbaudit: "Auditoria de BD",
    dbmonitor: "Monitor de Banco", reports: "Relatórios", alerts: "Alertas",
    settings: "Configurações", profile: "Meu Perfil", logout: "Sair da conta",
    // Dashboard
    dash_title: "Dashboard", dash_sub: "Visão geral de conformidade · Atualizado agora",
    new_audit: "Nova auditoria", export: "Exportar",
    audits_done: "Auditorias realizadas", occurrences: "Ocorrências detectadas",
    compliance_score: "Score de conformidade", risk_level: "Nível de risco",
    recent_alerts: "Alertas recentes", quick_access: "Acesso rápido",
    audits_by_day: "Auditorias por dia", by_severity: "Por severidade",
    see_all: "Ver todos →", last_7_days: "Últimos 7 dias",
    analyze_code: "Analisar código", audit_db: "Auditar banco",
    low: "Baixo", medium: "Médio", high: "Alto", stable: "estável",
    // Analyze
    analyze_title: "Análise de Código", analyze_sub: "Envie arquivos .py ou .js para verificar conformidade LGPD",
    drop_files: "Arraste seus arquivos aqui", select_files: "Selecionar arquivos",
    findings: "ocorrências encontradas", details: "Detalhes", rule: "Regra",
    description: "Descrição", file: "Arquivo", line: "Linha", severity: "Severidade",
    critical: "Crítico", action: "Ação", all: "Todos",
    // DB Monitor
    monitor_title: "Monitor de Banco de Dados", monitor_sub: "Métricas em tempo real da sua infraestrutura",
    status_up: "ONLINE", status_down: "OFFLINE", uptime: "Uptime",
    active_conn: "Conexões ativas", max_conn: "Limite",
    avg_latency: "Latência média", qps: "Queries/seg", slow_queries: "Queries lentas",
    cpu_usage: "Uso de CPU", memory_usage: "Memória", disk_usage: "Disco", io_ops: "I/O ops/s",
    db_size: "Tamanho do banco", table_size: "Maiores tabelas",
    locks: "Locks ativos", deadlocks: "Deadlocks", waiting: "Transações em espera",
    replication: "Replicação", replica_delay: "Delay réplica", replica_status: "Status",
    recent_logs: "Logs recentes", db_alerts: "Alertas do banco",
    table: "Tabela", size: "Tamanho", rows: "Linhas", type: "Tipo",
    expand: "Expandir", collapse: "Recolher",
    // Reports
    reports_title: "Relatórios e Histórico", reports_sub: "Auditorias salvas no Supabase",
    total_audits: "Total de auditorias", above_70: "Score acima de 70%",
    need_attention: "Necessitam atenção", filter: "Filtrar", export_all: "Exportar todos",
    // Alerts
    alerts_title: "Central de Alertas", mark_read: "Marcar todos lidos",
    unread: "não lidos", origin: "Origem", detected: "Detectado",
    open: "ABERTO", resolved: "RESOLVIDO",
    // Settings
    settings_title: "Configurações", settings_sub: "Personalize o Privyon",
    save: "Salvar alterações", notifications: "Notificações",
    email_alerts: "Alertas por e-mail", critical_only: "Apenas críticos",
    auto_report: "Relatório automático", alert_freq: "Frequência de alertas",
    realtime: "Tempo real", hourly: "A cada hora", daily: "Diário", weekly: "Semanal",
    integrations: "Integrações", groq_key: "Groq API Key",
    audit_prefs: "Preferências de Auditoria", scan_upload: "Escanear ao fazer upload",
    report_logo: "Logo nos relatórios PDF", save_history: "Salvar histórico no banco",
    show_lines: "Exibir números de linha",
    max_history: "Máximo de histórico", appearance: "Aparência",
    language: "Idioma", compact_mode: "Modo compacto", privacy: "Privacidade",
    anonymize: "Anonimizar logs", share_metrics: "Compartilhar métricas",
    data: "Dados", clear_history: "Limpar histórico local",
    cleared: "✓ Limpo!", clear: "Limpar", export_data: "Exportar dados",
    // Profile
    profile_title: "Meu Perfil", personal_info: "Informações pessoais",
    full_name: "Nome completo", email: "E-mail", change_password: "Alterar senha",
    current_password: "Senha atual", new_password: "Nova senha", confirm_password: "Confirmar nova senha",
    // Login
    welcome_back: "Bem-vindo de volta 👋", access_account: "Acesse sua conta para continuar",
    forgot_password: "Esqueci minha senha", enter: "Entrar no Privyon →",
    demo_access: "▶  Acessar conta demonstração",
    no_account: "não tem conta?", create_free: "Criar conta gratuita →",
    secure_conn: "Conexão segura · Dados protegidos com AES-256 e JWT",
  },
  "en-US": {
    dashboard: "Dashboard", analyze: "Code Analysis", dbaudit: "DB Audit",
    dbmonitor: "DB Monitor", reports: "Reports", alerts: "Alerts",
    settings: "Settings", profile: "My Profile", logout: "Sign out",
    dash_title: "Dashboard", dash_sub: "Compliance overview · Updated now",
    new_audit: "New audit", export: "Export",
    audits_done: "Audits performed", occurrences: "Detected occurrences",
    compliance_score: "Compliance score", risk_level: "Risk level",
    recent_alerts: "Recent alerts", quick_access: "Quick access",
    audits_by_day: "Audits by day", by_severity: "By severity",
    see_all: "See all →", last_7_days: "Last 7 days",
    analyze_code: "Analyze code", audit_db: "Audit database",
    low: "Low", medium: "Medium", high: "High", stable: "stable",
    analyze_title: "Code Analysis", analyze_sub: "Upload .py or .js files to check LGPD compliance",
    drop_files: "Drop your files here", select_files: "Select files",
    findings: "findings found", details: "Details", rule: "Rule",
    description: "Description", file: "File", line: "Line", severity: "Severity",
    critical: "Critical", action: "Action", all: "All",
    monitor_title: "Database Monitor", monitor_sub: "Real-time metrics of your infrastructure",
    status_up: "ONLINE", status_down: "OFFLINE", uptime: "Uptime",
    active_conn: "Active connections", max_conn: "Limit",
    avg_latency: "Avg latency", qps: "Queries/sec", slow_queries: "Slow queries",
    cpu_usage: "CPU usage", memory_usage: "Memory", disk_usage: "Disk", io_ops: "I/O ops/s",
    db_size: "Database size", table_size: "Largest tables",
    locks: "Active locks", deadlocks: "Deadlocks", waiting: "Waiting transactions",
    replication: "Replication", replica_delay: "Replica delay", replica_status: "Status",
    recent_logs: "Recent logs", db_alerts: "Database alerts",
    table: "Table", size: "Size", rows: "Rows", type: "Type",
    expand: "Expand", collapse: "Collapse",
    reports_title: "Reports & History", reports_sub: "Audits saved in Supabase",
    total_audits: "Total audits", above_70: "Score above 70%",
    need_attention: "Need attention", filter: "Filter", export_all: "Export all",
    alerts_title: "Alert Center", mark_read: "Mark all read",
    unread: "unread", origin: "Origin", detected: "Detected",
    open: "OPEN", resolved: "RESOLVED",
    settings_title: "Settings", settings_sub: "Customize Privyon",
    save: "Save changes", notifications: "Notifications",
    email_alerts: "Email alerts", critical_only: "Critical only",
    auto_report: "Auto report", alert_freq: "Alert frequency",
    realtime: "Real-time", hourly: "Hourly", daily: "Daily", weekly: "Weekly",
    integrations: "Integrations", groq_key: "Groq API Key",
    audit_prefs: "Audit Preferences", scan_upload: "Scan on upload",
    report_logo: "Logo in PDF reports", save_history: "Save history to database",
    show_lines: "Show line numbers",
    max_history: "Max history items", appearance: "Appearance",
    language: "Language", compact_mode: "Compact mode", privacy: "Privacy",
    anonymize: "Anonymize logs", share_metrics: "Share metrics",
    data: "Data", clear_history: "Clear local history",
    cleared: "✓ Cleared!", clear: "Clear", export_data: "Export data",
    profile_title: "My Profile", personal_info: "Personal information",
    full_name: "Full name", email: "Email", change_password: "Change password",
    current_password: "Current password", new_password: "New password", confirm_password: "Confirm new password",
    welcome_back: "Welcome back 👋", access_account: "Sign in to continue",
    forgot_password: "Forgot password", enter: "Enter Privyon →",
    demo_access: "▶  Access demo account",
    no_account: "don't have an account?", create_free: "Create free account →",
    secure_conn: "Secure connection · Data protected with AES-256 and JWT",
  },
  "es": {
    dashboard: "Panel", analyze: "Análisis de Código", dbaudit: "Auditoría de BD",
    dbmonitor: "Monitor de BD", reports: "Informes", alerts: "Alertas",
    settings: "Configuración", profile: "Mi Perfil", logout: "Cerrar sesión",
    dash_title: "Panel de control", dash_sub: "Resumen de cumplimiento · Actualizado ahora",
    new_audit: "Nueva auditoría", export: "Exportar",
    audits_done: "Auditorías realizadas", occurrences: "Ocurrencias detectadas",
    compliance_score: "Puntuación de cumplimiento", risk_level: "Nivel de riesgo",
    recent_alerts: "Alertas recientes", quick_access: "Acceso rápido",
    audits_by_day: "Auditorías por día", by_severity: "Por gravedad",
    see_all: "Ver todo →", last_7_days: "Últimos 7 días",
    analyze_code: "Analizar código", audit_db: "Auditar base de datos",
    low: "Bajo", medium: "Medio", high: "Alto", stable: "estable",
    analyze_title: "Análisis de Código", analyze_sub: "Sube archivos .py o .js para verificar cumplimiento LGPD",
    drop_files: "Arrastra tus archivos aquí", select_files: "Seleccionar archivos",
    findings: "ocurrencias encontradas", details: "Detalles", rule: "Regla",
    description: "Descripción", file: "Archivo", line: "Línea", severity: "Gravedad",
    critical: "Crítico", action: "Acción", all: "Todos",
    monitor_title: "Monitor de Base de Datos", monitor_sub: "Métricas en tiempo real de tu infraestructura",
    status_up: "EN LÍNEA", status_down: "FUERA DE LÍNEA", uptime: "Tiempo activo",
    active_conn: "Conexiones activas", max_conn: "Límite",
    avg_latency: "Latencia media", qps: "Consultas/seg", slow_queries: "Consultas lentas",
    cpu_usage: "Uso de CPU", memory_usage: "Memoria", disk_usage: "Disco", io_ops: "Ops I/O/s",
    db_size: "Tamaño de BD", table_size: "Tablas más grandes",
    locks: "Bloqueos activos", deadlocks: "Interbloqueos", waiting: "Transacciones en espera",
    replication: "Replicación", replica_delay: "Retraso réplica", replica_status: "Estado",
    recent_logs: "Registros recientes", db_alerts: "Alertas de BD",
    table: "Tabla", size: "Tamaño", rows: "Filas", type: "Tipo",
    expand: "Expandir", collapse: "Contraer",
    reports_title: "Informes e Historial", reports_sub: "Auditorías guardadas en Supabase",
    total_audits: "Total de auditorías", above_70: "Puntuación superior al 70%",
    need_attention: "Necesitan atención", filter: "Filtrar", export_all: "Exportar todo",
    alerts_title: "Centro de Alertas", mark_read: "Marcar todo leído",
    unread: "sin leer", origin: "Origen", detected: "Detectado",
    open: "ABIERTO", resolved: "RESUELTO",
    settings_title: "Configuración", settings_sub: "Personaliza Privyon",
    save: "Guardar cambios", notifications: "Notificaciones",
    email_alerts: "Alertas por correo", critical_only: "Solo críticos",
    auto_report: "Informe automático", alert_freq: "Frecuencia de alertas",
    realtime: "Tiempo real", hourly: "Cada hora", daily: "Diario", weekly: "Semanal",
    integrations: "Integraciones", groq_key: "Groq API Key",
    audit_prefs: "Preferencias de Auditoría", scan_upload: "Escanear al subir",
    report_logo: "Logo en informes PDF", save_history: "Guardar historial en BD",
    show_lines: "Mostrar números de línea",
    max_history: "Máximo de historial", appearance: "Apariencia",
    language: "Idioma", compact_mode: "Modo compacto", privacy: "Privacidad",
    anonymize: "Anonimizar registros", share_metrics: "Compartir métricas",
    data: "Datos", clear_history: "Limpiar historial local",
    cleared: "✓ ¡Limpiado!", clear: "Limpiar", export_data: "Exportar datos",
    profile_title: "Mi Perfil", personal_info: "Información personal",
    full_name: "Nombre completo", email: "Correo electrónico", change_password: "Cambiar contraseña",
    current_password: "Contraseña actual", new_password: "Nueva contraseña", confirm_password: "Confirmar contraseña",
    welcome_back: "Bienvenido de vuelta 👋", access_account: "Accede a tu cuenta para continuar",
    forgot_password: "Olvidé mi contraseña", enter: "Entrar en Privyon →",
    demo_access: "▶  Acceder con cuenta demo",
    no_account: "¿no tienes cuenta?", create_free: "Crear cuenta gratuita →",
    secure_conn: "Conexión segura · Datos protegidos con AES-256 y JWT",
  },
};

export type T = typeof TRANSLATIONS["pt-BR"];
interface LangCtx { lang: Lang; t: T; setLang: (l: Lang) => void; }
const Ctx = createContext<LangCtx>({ lang: "pt-BR", t: TRANSLATIONS["pt-BR"], setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("pt-BR");

  useEffect(() => {
    const saved = localStorage.getItem("privyon_lang") as Lang;
    if (saved && TRANSLATIONS[saved]) setLangState(saved);
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    localStorage.setItem("privyon_lang", l);
  }

  return (
    <Ctx.Provider value={{ lang, t: TRANSLATIONS[lang], setLang }}>
      {children}
    </Ctx.Provider>
  );
}

export function useLang() { return useContext(Ctx); }
