import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

export default function Privacy() {
    const navigate = useNavigate();

    return (
        <>
            <div className="navbar">
                <Navbar />
            </div>

            <div className="privacy-policy">

                <header className="privacy-header">
                    <h1>Muscle Up Privacy Policy</h1>

                    <p className="privacy-date">
                        Last updated: August 25, 2026
                    </p>
                </header>


                <section>
                    <h2>1. About Muscle Up</h2>

                    <p>
                        Muscle Up is a fitness and workout tracking application
                        that allows users to create workout routines, record
                        workouts, track progress, and manage their fitness
                        information.
                    </p>

                    <p>
                        This Privacy Policy explains what information Muscle Up
                        collects, how that information is used and stored, who
                        may process it, and the choices you have regarding your
                        information.
                    </p>

                    <p>
                        Muscle Up is an independently operated fitness and workout tracking service.
                    </p>
                </section>


                <section>
                    <h2>2. Information We Collect</h2>

                    <p>
                        Muscle Up collects and stores information that you
                        provide when creating and using your account. We only
                        collect information that is reasonably necessary to
                        provide and operate the service.
                    </p>

                    <p>This may include:</p>

                    <ul>
                        <li>
                            <strong>Account information</strong>, such as your
                            username, email address, and account identifier.
                        </li>

                        <li>
                            <strong>Authentication information</strong> required
                            to securely authenticate your Muscle Up account.
                            Authentication is provided through Amazon Cognito.
                        </li>

                        <li>
                            <strong>Workout information</strong>, including
                            workout names, exercises, sets, repetitions,
                            weights, cardio information, duration, dates,
                            rounds, and notes.
                        </li>

                        <li>
                            <strong>Weight-tracking information</strong> that
                            you choose to enter.
                        </li>

                        <li>
                            <strong>Application preferences</strong>, such as
                            your preferred weight and distance units.
                        </li>
                    </ul>

                    <p>
                        Muscle Up does not intentionally collect information
                        that is not necessary to provide the application's
                        functionality.
                    </p>
                </section>


                <section>
                    <h2>3. How We Use Your Information</h2>

                    <p>
                        We use your information to provide and operate Muscle
                        Up. This includes authenticating your account, storing
                        and displaying your workouts and workout history,
                        managing workout templates, displaying statistics,
                        storing weight records, and remembering your
                        application preferences.
                    </p>

                    <p>
                        Information may also be used to maintain the security,
                        reliability, and proper operation of Muscle Up.
                    </p>

                    <p>
                        We do not use your personal information or workout data
                        for purposes unrelated to providing and operating
                        Muscle Up.
                    </p>

                    <p>
                        <strong>
                            We do not sell your personal information or workout
                            data.
                        </strong>
                    </p>
                </section>


                <section>
                    <h2>4. How Your Information Is Stored</h2>

                    <p>
                        Muscle Up uses Amazon Web Services (AWS) to provide the
                        cloud infrastructure required to operate the service.
                    </p>

                    <p>
                        Account authentication is handled through{' '}
                        <strong>Amazon Cognito</strong>. Application data,
                        including workout records, workout templates, weight
                        records, and application preferences, is stored using{' '}
                        <strong>Amazon DynamoDB</strong>.
                    </p>

                    <p>
                        Your information is associated with your Muscle Up
                        account so that it can be securely retrieved and
                        displayed to you when you use the application.
                    </p>
                </section>


                <section>
                    <h2>5. How We Share Your Information</h2>

                    <p>
                        Muscle Up does not sell, rent, or publicly share your
                        personal information or workout data.
                    </p>

                    <p>
                        We use Amazon Web Services as a service provider to
                        operate Muscle Up. Information may therefore be
                        processed or stored by AWS on our behalf for purposes
                        such as account authentication, database storage, and
                        operating the application's infrastructure.
                    </p>

                    <p>
                        We do not provide your workout information to
                        advertisers or use your workout information for
                        advertising purposes.
                    </p>

                    <p>
                        We may disclose information if required by law or when
                        reasonably necessary to protect the security, rights,
                        or property of Muscle Up, its users, or others.
                    </p>
                </section>


                <section>
                    <h2>6. Your Control Over Your Data</h2>

                    <p>
                        You have control over the information you provide to
                        Muscle Up. You can view, edit, and manage your workout
                        information, workout templates, and other information
                        available through your account.
                    </p>

                    <p>
                        You can delete your Muscle Up account and its associated
                        data directly within the Muscle Up application at any
                        time.
                    </p>

                    <p>
                        Account deletion is also available through the Muscle
                        Up website. You can visit{' '}
                        <a
                            href="https://muscleup.live"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            muscleup.live
                        </a>{' '}
                        to access your account and delete your account without
                        using the mobile application.
                    </p>

                    <p>
                        Account deletion is an automatic process initiated by
                        the user. You do not need to contact Muscle Up or wait
                        for manual approval to delete your account.
                    </p>

                    <p>
                        When you delete your account, your account and
                        associated data are permanently deleted from Muscle
                        Up's systems. This includes your workout records,
                        workout templates, weight records, application
                        preferences, and account information.
                    </p>

                    <p>
                        <strong>
                            Account deletion is permanent and cannot be undone
                            or restored. Muscle Up does not retain your deleted
                            account or associated workout data.
                        </strong>
                    </p>

                    <p>
                        Deletion is performed automatically when the account
                        deletion process is successfully completed. In the
                        event of a temporary service outage or technical
                        failure that prevents the deletion process from
                        completing, the account may remain temporarily active
                        until the deletion request can be successfully
                        processed.
                    </p>

                    <p>
                        Once the deletion process has successfully completed,
                        Muscle Up does not keep copies of the deleted account
                        or its associated personal and workout information for
                        recovery, restoration, or future use.
                    </p>
                </section>


                <section>
                    <h2>7. Data Security</h2>

                    <p>
                        We take reasonable technical and organizational
                        measures to protect your information against
                        unauthorized access, alteration, disclosure, or
                        destruction.
                    </p>

                    <p>
                        Muscle Up uses authentication and access controls to
                        protect user accounts and uses AWS infrastructure to
                        store application data.
                    </p>

                    <p>
                        However, no method of transmitting or storing
                        information electronically can be guaranteed to be
                        completely secure.
                    </p>
                </section>


                <section>
                    <h2>8. Data Retention</h2>

                    <p>
                        We retain your information for as long as necessary to
                        provide Muscle Up's services while your account remains
                        active.
                    </p>

                    <p>
                        When you delete your account, the account and all
                        associated user data are permanently deleted from
                        Muscle Up's systems through the automatic account
                        deletion process.
                    </p>

                    <p>
                        <strong>
                            Muscle Up does not retain deleted account data.
                        </strong>
                    </p>

                    <p>
                        Deleted accounts and their associated workout data
                        cannot be restored after the deletion process has
                        successfully completed.
                    </p>

                    <p>
                        Muscle Up does not currently maintain a separate
                        archive, backup, or recovery copy of deleted user
                        account data for the purpose of restoring deleted
                        accounts.
                    </p>
                </section>


                <section>
                    <h2>9. Analytics and Advertising</h2>

                    <p>
                        Muscle Up does not currently use third-party analytics
                        services to track users.
                    </p>

                    <p>
                        Muscle Up does not currently use third-party
                        advertising services.
                    </p>

                    <p>
                        We do not sell user information to advertisers and do
                        not use workout information for advertising.
                    </p>
                </section>


                <section>
                    <h2>10. Children's Privacy</h2>

                    <p>
                        Muscle Up is not intended for children under the age of
                        13. We do not knowingly collect personal information
                        from children under 13.
                    </p>

                    <p>
                        If we become aware that personal information from a
                        child under 13 has been collected, we will take
                        reasonable steps to delete that information.
                    </p>
                </section>


                <section>
                    <h2>11. Changes to This Privacy Policy</h2>

                    <p>
                        We may update this Privacy Policy from time to time as
                        Muscle Up's features, services, or data practices
                        change.
                    </p>

                    <p>
                        When changes are made, the "Last updated" date at the
                        beginning of this policy will be updated. We encourage
                        users to review this page periodically.
                    </p>
                </section>


                <section>
                    <h2>12. Contact Us</h2>

                    <div className="privacy-contact">

                        <p>
                            If you have questions about this Privacy Policy,
                            your information, or your data deletion rights,
                            you can contact Muscle Up at:
                        </p>

                        <p className="privacy-email">
                            <strong>Email:</strong>{' '}
                            <a
                                href="mailto:support@muscleup.live"
                            >
                                support@muscleup.live
                            </a>
                        </p>

                        <p>
                            <strong>Website:</strong>{' '}
                            <a
                                href="https://muscleup.live"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                muscleup.live
                            </a>
                        </p>

                    </div>
                </section>


                <div className="privacy-back">
                    <button
                        className="hero-btn primary-btn"
                        onClick={() => navigate("/home")}
                    >
                        Home
                    </button>
                </div>

            </div>
        </>
    );
}