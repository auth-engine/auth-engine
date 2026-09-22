import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
    title: "Terms & Conditions — AuthEngine",
    description: "The terms governing use of AuthEngine's open-source software and hosted service.",
};

export default function TermsPage() {
    return (
        <LegalShell title="Terms &amp; Conditions" updated="June 13, 2026">
            <section>
                <p>
                    These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use
                    of the AuthEngine website, hosted service, and open-source software
                    (collectively, the &ldquo;Service&rdquo;). By using the Service, you agree to
                    these Terms.
                </p>
            </section>

            <section>
                <h2>1. Open-source license</h2>
                <p>
                    The AuthEngine software is released under the <strong>MIT License</strong>. Your
                    use, modification, and distribution of the source code are governed by that
                    license. These Terms additionally apply to the websites and hosted service we
                    operate.
                </p>
            </section>

            <section>
                <h2>2. Accounts &amp; eligibility</h2>
                <ul>
                    <li>You must provide accurate information and keep your credentials secure.</li>
                    <li>You are responsible for all activity that occurs under your account.</li>
                    <li>You must be legally capable of entering into these Terms.</li>
                </ul>
            </section>

            <section>
                <h2>3. Acceptable use</h2>
                <p>You agree not to:</p>
                <ul>
                    <li>Use the Service for unlawful, harmful, or fraudulent purposes.</li>
                    <li>Attempt to breach, probe, or disrupt the security of the Service.</li>
                    <li>Abuse messaging features (email/SMS) to send spam or unsolicited content.</li>
                    <li>Reverse engineer hosted infrastructure beyond what the license permits.</li>
                </ul>
            </section>

            <section>
                <h2>4. Self-hosting responsibilities</h2>
                <p>
                    If you self-host AuthEngine, you are solely responsible for your deployment,
                    including security, data protection, backups, compliance, and the conduct of
                    your end users. The maintainers provide the software &ldquo;as is&rdquo; without
                    operational responsibility for your instance.
                </p>
            </section>

            <section>
                <h2>5. Intellectual property</h2>
                <p>
                    The source code is licensed under the MIT License. The AuthEngine name, logo,
                    and brand assets are trademarks and may not be used in a way that implies
                    endorsement without permission.
                </p>
            </section>

            <section>
                <h2>6. Disclaimer of warranties</h2>
                <p>
                    The Service is provided <strong>&ldquo;as is&rdquo;</strong> and
                    <strong> &ldquo;as available&rdquo;</strong> without warranties of any kind,
                    whether express or implied, including merchantability, fitness for a particular
                    purpose, and non-infringement.
                </p>
            </section>

            <section>
                <h2>7. Limitation of liability</h2>
                <p>
                    To the maximum extent permitted by law, AuthEngine and its contributors shall
                    not be liable for any indirect, incidental, special, consequential, or punitive
                    damages, or any loss of data, profits, or revenue arising from your use of the
                    Service.
                </p>
            </section>

            <section>
                <h2>8. Termination</h2>
                <p>
                    We may suspend or terminate access to the hosted Service if you violate these
                    Terms. You may stop using the Service at any time. Provisions that by their
                    nature should survive termination will survive.
                </p>
            </section>

            <section>
                <h2>9. Changes to these Terms</h2>
                <p>
                    We may update these Terms periodically. Continued use of the Service after
                    changes take effect constitutes acceptance of the revised Terms.
                </p>
            </section>

            <section>
                <h2>10. Contact</h2>
                <p>
                    Questions about these Terms? Email{" "}
                    <a href="mailto:support@authengine.org">support@authengine.org</a>.
                </p>
            </section>
        </LegalShell>
    );
}
