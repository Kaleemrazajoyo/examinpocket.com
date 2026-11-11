import React from 'react';
import { useNavigate } from 'react-router-dom';
import { INFO_PAGES } from '../lib/infoContent.js';

function InfoPage({ page }) {
    const navigate = useNavigate();

    return (
        <section className="max-w-4xl mx-auto w-full">
            <article className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex flex-wrap items-center gap-1.5">
                    <a
                        href="/"
                        onClick={(e) => { e.preventDefault(); navigate('/'); window.scrollTo({ top: 0 }); }}
                        className="hover:text-indigo-700 transition"
                    >
                        Home
                    </a>
                    <i className="fa-solid fa-chevron-right text-[9px] text-slate-400"></i>
                    <span className="text-slate-700">{page.heading}</span>
                </nav>

                <header className="space-y-3 border-b border-slate-100 pb-5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{page.heading}</h1>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{page.intro}</p>
                </header>

                <div className="space-y-6">
                    {page.sections.map((section) => (
                        <section key={section.heading} className="space-y-3">
                            <h2 className="text-lg font-bold text-slate-900 flex items-start gap-2">
                                <i className="fa-solid fa-circle-check text-amber-500 text-sm mt-1"></i>
                                <span>{section.heading}</span>
                            </h2>
                            {section.paragraphs.map((paragraph, index) => (
                                <p key={index} className="text-sm text-slate-700 leading-relaxed">{paragraph}</p>
                            ))}
                            {Array.isArray(section.list) && section.list.length > 0 && (
                                <ul className="space-y-2 pl-1">
                                    {section.list.map((item) => (
                                        <li key={item} className="text-sm text-slate-700 leading-relaxed flex gap-2">
                                            <span className="text-amber-500 shrink-0">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>

                <footer className="border-t border-slate-100 pt-5 space-y-1.5 text-xs text-slate-500">
                    <p>Last updated: {page.updated}</p>
                    <p>
                        Questions or corrections? Email{' '}
                        <a href={`mailto:${page.contactEmail}`} className="text-indigo-700 font-semibold hover:underline">
                            {page.contactEmail}
                        </a>
                        .
                    </p>
                </footer>
            </article>
        </section>
    );
}

export function AboutPage() {
    return <InfoPage page={INFO_PAGES.about} />;
}

export function PrivacyPage() {
    return <InfoPage page={INFO_PAGES.privacy} />;
}

export function TermsPage() {
    return <InfoPage page={INFO_PAGES.terms} />;
}

export function DisclaimerPage() {
    return <InfoPage page={INFO_PAGES.disclaimer} />;
}
