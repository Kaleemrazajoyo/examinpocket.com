/**
 * Public information pages: About, Privacy, Terms, Disclaimer.
 *
 * Kept in one plain-JS file so the React app and the prerender script use the
 * exact same copy. Search engines then see the same text a visitor sees.
 */

const CONTACT_EMAIL = 'kaleemrjoyo@gmail.com';
const UPDATED = '12 November 2026';

export const INFO_PAGES = {
    about: {
        key: 'about',
        path: '/about',
        title: 'About ExamInPocket - Exam Prep Built for Pakistani Students',
        description:
            'Who runs ExamInPocket, how our MCQs and notes are prepared, and how to report a mistake or suggest a topic.',
        heading: 'About ExamInPocket',
        intro:
            "ExamInPocket is a free study site for people preparing for CSS, PMS, PCS, CCE and other competitive exams in Pakistan. No login wall for practice, no paid coaching pitch.",
        updated: UPDATED,
        contactEmail: CONTACT_EMAIL,
        sections: [
            {
                heading: 'Why this site exists',
                paragraphs: [
                    `Most preparation material in Pakistan lives in scattered places. A PDF forwarded on WhatsApp. A photocopied handout from an academy. A link that stopped working two years ago. Finding a straight answer to a simple question can take longer than learning the answer itself.`,
                    `ExamInPocket was built to fix that small but annoying problem. One place to practise MCQs, read the explanation, take a timed test and move on. If you have ten minutes on a bus, you should be able to use them.`,
                ],
            },
            {
                heading: 'What you can use here',
                paragraphs: [
                    `The MCQ bank is organised by subject, from General Knowledge and Pakistan Studies to English, Islamiat, Everyday Science and Mathematics. Every question has four options, a marked answer and an explanation you can open after attempting it.`,
                    `There are also timed mock tests with a subject-wise breakdown, daily Dawn vocabulary with Urdu meanings, editorial articles, a small PDF library and an AI tutor that signed-in users can ask for study help.`,
                ],
            },
            {
                heading: 'How the questions are prepared',
                paragraphs: [
                    `Questions are written or collected from standard reference material, then checked against at least one reliable source before they go live. Explanations are written in our own words so they actually explain the answer instead of repeating it.`,
                    `This is a living bank. If an answer key looks wrong, it probably needs a second look. Tell us and we will check the source, correct it and note the change. We would rather fix a mistake than defend it.`,
                ],
            },
            {
                heading: 'Reader submissions and comments',
                paragraphs: [
                    `Users can submit their own MCQs after signing in. Submissions are reviewed before publishing, and approved questions show the contributor's name. Comments are open to everyone, but the email address is kept for moderation and never shown publicly.`,
                ],
            },
            {
                heading: 'Who is behind it',
                paragraphs: [
                    `ExamInPocket is an independent project. It is not affiliated with FPSC, PPSC, SPSC, NTS, any provincial commission or any academy. We do not claim to have inside information about papers, and we do not sell guess papers.`,
                    `The site is maintained from Pakistan by a small team that has sat the same exams and knows how frustrating scattered notes can be.`,
                ],
            },
            {
                heading: 'Get in touch',
                paragraphs: [
                    `Corrections, topic requests and partnership questions are welcome at ${CONTACT_EMAIL}. We read everything, though replies can take a day or two.`,
                    `If you are reporting a wrong answer, please include the question, the option you think is correct and a source if you have one. That makes the fix much faster.`,
                ],
            },
        ],
    },

    privacy: {
        key: 'privacy',
        path: '/privacy',
        title: 'Privacy Policy - ExamInPocket',
        description:
            'How ExamInPocket collects, uses and protects your data, including cookies, accounts, comments and advertising.',
        heading: 'Privacy Policy',
        intro:
            'This page explains what we collect when you use ExamInPocket, why we collect it, and what you can ask us to do with it.',
        updated: UPDATED,
        contactEmail: CONTACT_EMAIL,
        sections: [
            {
                heading: 'Information you give us',
                paragraphs: [
                    `When you create an account, we store your name, email address and a hashed password. We never store the password itself.`,
                    `When you comment, we store the name, email and comment text. Your name and comment are public. Your email is visible only to admins for moderation.`,
                    `When you submit an MCQ, we store the question, options, answer, explanation, your name and email so we can review it and credit you if it is published.`,
                    `Mock test answers, saved MCQs and AI tutor messages are stored so those features work for your account.`,
                ],
            },
            {
                heading: 'Information collected automatically',
                paragraphs: [
                    `Like most websites, our servers receive basic technical data when you visit: IP address, browser type, device type, referring page and the pages you open. This is used for security, debugging and understanding which sections are useful.`,
                    `We use a small number of cookies and browser storage entries. The login cookie keeps you signed in. Local storage remembers things like the news ticker text so the page does not flicker on every visit.`,
                ],
            },
            {
                heading: 'How we use your information',
                paragraphs: [`We use the data described above to:`],
                list: [
                    'run your account, comments, submissions, saved items and mock test results',
                    'review submitted questions and moderate comments',
                    'fix bugs, improve explanations and decide which subjects need more material',
                    'answer emails and take-down or correction requests',
                    'protect the site from spam, scraping and abuse',
                ],
            },
            {
                heading: 'Cookies and advertising',
                paragraphs: [
                    `We do not sell your personal information.`,
                    `If we display ads through Google AdSense, Google and its partners may use cookies to show ads based on your visits to this and other websites. Google's use of advertising cookies lets it and its partners serve ads to you based on your visit here and elsewhere online.`,
                    `You can opt out of personalised advertising in Google Ads Settings at https://www.google.com/settings/ads. You can also visit https://www.aboutads.info to learn about opt-outs from other advertising providers.`,
                    `You can block or delete cookies in your browser. Some parts of the site, such as staying logged in, may stop working if you do.`,
                    `We may use privacy-friendly analytics to count visits. If we add analytics or advertising tools later, this page will be updated before they go live.`,
                ],
            },
            {
                heading: 'Sharing your data',
                paragraphs: [
                    `We share data only with the services that keep the site running: hosting, database and email providers. They process it on our instructions. We may also disclose information if the law requires it or if it is needed to stop abuse.`,
                    `We do not rent or sell email lists.`,
                ],
            },
            {
                heading: 'Retention and security',
                paragraphs: [
                    `Account data stays while your account is open. Comments and published submissions may stay after that because they are part of public pages. Server logs are kept for a limited period for security.`,
                    `Passwords are hashed and traffic is encrypted over HTTPS. No system is perfect, so please use a unique password and tell us if you notice anything unusual.`,
                ],
            },
            {
                heading: 'Children',
                paragraphs: [
                    `The site is meant for exam candidates. If you are under 13, please do not create an account. If you are under 16 in a country with a higher digital consent age, use the site with a parent or guardian.`,
                ],
            },
            {
                heading: 'Your choices',
                paragraphs: [
                    `You can ask to see, correct or delete your account data by emailing ${CONTACT_EMAIL}. You can also ask us to remove a comment. We may need to keep limited records where the law requires it.`,
                ],
            },
            {
                heading: 'Changes to this policy',
                paragraphs: [
                    `If this policy changes in a meaningful way, we will update the date at the top. For significant changes, we will also put a notice on the site.`,
                ],
            },
        ],
    },

    terms: {
        key: 'terms',
        path: '/terms',
        title: 'Terms of Use - ExamInPocket',
        description:
            'The rules for using ExamInPocket, including accounts, comments, submitted questions, intellectual property and liability.',
        heading: 'Terms of Use',
        intro:
            'By using ExamInPocket, you agree to these terms. They are written in plain language on purpose.',
        updated: UPDATED,
        contactEmail: CONTACT_EMAIL,
        sections: [
            {
                heading: 'Using the site',
                paragraphs: [
                    `ExamInPocket is free for personal study. You may read pages, attempt questions and share links with friends.`,
                    `Please do not scrape the site, republish large parts of it, resell access or use automated tools to pull content without written permission. Do not try to break, overload or bypass the security of the site.`,
                ],
            },
            {
                heading: 'Accounts',
                paragraphs: [
                    `You are responsible for the information you put in your account and for keeping your password private. Use one account per person.`,
                    `We may suspend or remove an account if it is used for spam, abuse, impersonation or attempts to access admin features.`,
                ],
            },
            {
                heading: 'Comments and submitted questions',
                paragraphs: [
                    `You keep ownership of what you write, but by posting it you give us permission to publish, edit for clarity and moderate it on the site.`,
                    `Do not post hate speech, threats, personal attacks, spam, advertising or material you do not have the right to share. Comments that break these rules may be removed without notice.`,
                    `Submitted MCQs are reviewed before publishing. We may edit the wording, correct an answer key or decline a question that duplicates existing content or cannot be verified. Approved questions show the contributor's name.`,
                ],
            },
            {
                heading: 'Content and intellectual property',
                paragraphs: [
                    `The site design, explanations and original text belong to ExamInPocket or are used with permission. You may print a page or share a link for personal study, but do not copy large sections into another website, book or paid course.`,
                    `Facts and question ideas are not owned by anyone. The specific wording and explanations on this site are.`,
                ],
            },
            {
                heading: 'No guarantees',
                paragraphs: [
                    `The content is for practice and general information. We work to keep it accurate, but we cannot promise that every answer key, explanation or date is free of mistakes.`,
                    `Official sources, current notifications and your own preparation decide your result. Using this site does not guarantee marks, selection or admission.`,
                ],
            },
            {
                heading: 'Third-party links',
                paragraphs: [
                    `Some pages link to external websites, PDFs or books hosted elsewhere. We do not control those sites and are not responsible for their content, availability or privacy practices.`,
                ],
            },
            {
                heading: 'Limitation of liability',
                paragraphs: [
                    `To the extent permitted by law, ExamInPocket is not liable for indirect or consequential losses arising from use of the site, including lost time, lost opportunities or reliance on an incorrect answer.`,
                    `The site is provided as it is. We may change, pause or remove features at any time.`,
                ],
            },
            {
                heading: 'Changes to these terms',
                paragraphs: [
                    `We may update these terms as the site grows. The date at the top shows the latest version. Continuing to use the site after a change means you accept the updated terms.`,
                ],
            },
            {
                heading: 'Governing law',
                paragraphs: [
                    `These terms are governed by the laws of Pakistan. Any dispute will be handled by the courts of Pakistan.`,
                ],
            },
        ],
    },

    disclaimer: {
        key: 'disclaimer',
        path: '/disclaimer',
        title: 'Disclaimer - ExamInPocket',
        description:
            'ExamInPocket is an independent study resource. Read what our content is and is not before relying on it.',
        heading: 'Disclaimer',
        intro:
            'A short, honest note about what ExamInPocket is and what it is not.',
        updated: UPDATED,
        contactEmail: CONTACT_EMAIL,
        sections: [
            {
                heading: 'An independent study resource',
                paragraphs: [
                    `ExamInPocket is not affiliated with FPSC, PPSC, SPSC, KPPSC, BPSC, NTS, the CSS/PMS authorities or any academy. Names of exams and organisations are used only to describe the material.`,
                ],
            },
            {
                heading: 'Accuracy of content',
                paragraphs: [
                    `We check questions and explanations before publishing, but mistakes still happen. Answer keys can be wrong, and a fact that was correct last year may be outdated today.`,
                    `Official notifications, textbooks and commission publications always take priority over anything on this site. If you spot an error, email ${CONTACT_EMAIL} with the question and a source so we can correct it.`,
                ],
            },
            {
                heading: 'No exam guarantee',
                paragraphs: [
                    `Practising here does not guarantee marks, a passing score or selection. We do not claim to have leaked papers, inside information or guaranteed guess papers. Results depend on your preparation and the exam itself.`,
                ],
            },
            {
                heading: 'AI tutor',
                paragraphs: [
                    `The AI tutor can be helpful for study plans and explanations, but it can also be wrong, incomplete or out of date. Treat its answers as a starting point and verify important facts with a reliable source.`,
                ],
            },
            {
                heading: 'External links and library files',
                paragraphs: [
                    `The library links to PDFs and books hosted on third-party services. We do not host those files and do not control their availability. Copyright belongs to the original authors and publishers. If you own a file and want it removed, contact us and we will remove the link.`,
                ],
            },
            {
                heading: 'Not professional advice',
                paragraphs: [
                    `Content on this site is general educational information. It is not legal, financial, medical or career advice, and it should not be treated as a substitute for professional guidance.`,
                ],
            },
        ],
    },
};

export const INFO_PAGE_LIST = Object.values(INFO_PAGES);
