import type { Metadata } from "next";
import { LegalShell } from "@/components/legal-shell";

export const metadata: Metadata = {
    title: "Privacy Policy — AuthEngine",
    description: "How AuthEngine collects, uses, and protects personal data.",
};

export default function PrivacyPolicyPage() {
    return (
        <LegalShell title="Privacy Policy" updated="June 13, 2026">
            <section>
                <p>
                    AuthEngine (&ldquo;AuthEngine&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an
                    open-source identity platform. This Privacy Policy explains how we handle
                    personal data for the hosted service at <strong>authengine.org</strong> and
                    its subdomains. It also clarifies the responsibilities of organizations that
                    self-host the open-source software.
                </p>
            </section>

            <section>
                <h2>1. Open-source &amp; self-hosting</h2>
                <p>
                    AuthEngine is distributed as open-source software. When you self-host
                    AuthEngine on your own infrastructure, <strong>you</strong> are the data
                    controller for the identities and data stored in your deployment. This policy
                    governs only the instances and websites operated directly by AuthEngine.
                </p>
            </section>

            <section>
                <h2>2. Information we collect</h2>
                <ul>
                    <li><strong>Account data:</strong> name, username, email address, and phone number.</li>
                    <li><strong>Authentication data:</strong> hashed passwords, passkey (WebAuthn) credentials, MFA enrollment, and linked social accounts.</li>
                    <li><strong>Tenant data:</strong> organization membership, roles, and access policies.</li>
                    <li><strong>Usage &amp; security logs:</strong> IP address, device/browser metadata, login events, and audit records.</li>
                    <li><strong>Contact submissions:</strong> details you provide through our contact forms.</li>
                </ul>
            </section>

            <section>
                <h2>3. How we use information</h2>
                <ul>
                    <li>To authenticate you and operate the identity service.</li>
                    <li>To send transactional messages such as verification codes and security alerts.</li>
                    <li>To detect, prevent, and investigate fraud and abuse.</li>
                    <li>To maintain audit trails and comply with legal obligations.</li>
                    <li>To respond to your inquiries and provide support.</li>
                </ul>
            </section>

            <section>
                <h2>4. Service providers</h2>
                <p>
                    We share the minimum data necessary with infrastructure and communication
                    providers, including <strong>Amazon Web Services</strong> (hosting and email
                    delivery via SES) and our SMS gateway provider for delivering one-time codes.
                    These providers process data on our behalf under appropriate agreements.
                </p>
            </section>

            <section>
                <h2>5. Data retention</h2>
                <p>
                    We retain personal data for as long as your account is active or as needed to
                    provide the service. Security and audit logs are retained for a limited period
                    to meet security and legal requirements, after which they are deleted or
                    anonymized.
                </p>
            </section>

            <section>
                <h2>6. Security</h2>
                <p>
                    We use industry-standard safeguards including encryption in transit, password
                    hashing, scoped access tokens, and role-based access control. No system is
                    perfectly secure, but we work to protect your data and continuously improve our
                    controls.
                </p>
            </section>

            <section>
                <h2>7. Your rights</h2>
                <p>
                    Depending on your jurisdiction, you may have the right to access, correct,
                    export, or delete your personal data, and to object to or restrict certain
                    processing. To exercise these rights, contact us using the details below.
                </p>
            </section>

            <section>
                <h2>8. Cookies</h2>
                <p>
                    We use strictly necessary cookies and local storage to maintain your session
                    and security state. We do not use third-party advertising trackers.
                </p>
            </section>

            <section>
                <h2>9. Changes to this policy</h2>
                <p>
                    We may update this Privacy Policy from time to time. Material changes will be
                    reflected by updating the &ldquo;Last updated&rdquo; date at the top of this page.
                </p>
            </section>

            <section>
                <h2>10. Contact</h2>
                <p>
                    Questions about this policy? Email{" "}
                    <a href="mailto:support@authengine.org">support@authengine.org</a>.
                </p>
            </section>
        </LegalShell>
    );
}
