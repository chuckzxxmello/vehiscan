<img src="https://readme-typing-svg.herokuapp.com?font=Anaheim&size=32&duration=3000&pause=2000&color=1F51FF&width=1000&lines=Vehiscan;Vehicle+Registration+Tracker+App" alt="Typing SVG" />

Vehiscan is a prototype mobile application designed to help users manage their vehicle registration records, track expiration dates, and securely store digital copies of important documents.

### Project Overview
The Vehicle Registration Tracker App—VehiScan—is developed to assist vehicle owners and relevant authorities in managing and monitoring vehicle registration details. This project addresses a critical and widespread issue in the Philippines: the failure of a majority of motorists to renew their vehicle registration on time. According to the Land Transportation Office (LTO), approximately 60–65% of vehicles nationwide are delinquent, meaning their registrations are overdue by at least one year. Out of an estimated 38 million registered vehicles, only around 14 million are considered up to date (Manila Standard, 2023). These delays are often due to forgetfulness, lack of reminders, or the inconvenience of manual tracking, which can lead to legal penalties, fines, and administrative burdens.

VehiScan aims to solve these problems by offering a user-friendly mobile application that allows users to securely store their registration data, track expiration dates, and receive timely alerts for renewals. By enhancing organization and accountability, the app promotes road safety, legal compliance, and convenience for vehicle owners and enforcement agencies alike.


### Security Features

The VehiScan App is built with a strong emphasis on security to protect sensitive user data and prevent unauthorized access. The system integrates multiple layers of protection across authentication, data access, and user interaction. Each security feature was strategically chosen to address specific threats and ensure data integrity, confidentiality, and availability.

Firebase Authentication with Email Verification
Firebase Authentication is used to manage user identities securely, supporting email/password login and ensuring that only verified users gain access to the app. By requiring users to confirm their email before accessing core features, this mechanism prevents fake or unauthorized accounts from being activated and helps maintain a trustworthy user base. It is scalable, easy to integrate with React Native, and includes built-in password reset and account management, preventing unauthorized access and protecting user identities effectively.

### Role-Based Access Control (RBAC)
The system implements role-based access control (RBAC) to restrict access to specific screens and operations based on user roles such as Admin, Inspector, or User, as defined in the Firestore database. By enforcing the principle of least privilege, RBAC minimizes internal misuse or accidental data exposure by strictly controlling what each user role can see and do, thereby enhancing security and operational integrity.
Session Management and Auto Sign-Out
VehiScan includes session management logic that automatically signs out users after a period of inactivity or when a session becomes invalid. This feature helps protect sensitive data if a user leaves the app open on a shared or unattended device, reducing the window of opportunity for unauthorized access. Recognizing that mobile apps are often left running in the background, this measure significantly strengthens data protection.
Account Lockout After Multiple Failed Login Attempts
To prevent brute-force attacks, the system tracks login failures and temporarily locks an account after multiple incorrect login attempts. This approach slows down automated bots or attackers trying to guess passwords, safeguarding user accounts and maintaining system integrity.

### Firestore Security Rules
All access to Firestore data is controlled by customized security rules based on user authentication and role. This granular access control ensures that users can only access their own registration records, while admins can manage broader system data. By enforcing these rules at the database level, the system prevents unauthorized data access and enhances overall security.

### Email and Password Reset Mechanism
VehiScan supports secure password recovery through Firebase’s built-in password reset functionality. Users can request a reset email sent to their verified address, preventing unauthorized password changes and ensuring that only legitimate users with access to their verified email accounts can modify credentials.

### Cross-Site Scripting (XSS) Prevention
All user-generated content, such as vehicle owner names or text inputs, is sanitized before rendering in the app. By avoiding the insertion of raw HTML into views and stripping potentially harmful tags, VehiScan prevents malicious scripts from executing, thus protecting both user sessions and the application itself from cross-site scripting attacks.

### Rate Limiting
To prevent abuse of features such as QR scanning, VehiScan implements a custom client-side rate limiting solution. This approach tracks user activity locally and restricts the number of QR scans allowed within a given period. By handling this logic on the client side, the app effectively limits excessive usage, protects backend resources, and maintains consistent performance, even without relying on Firebase Functions.
Additional Security Testing
VehiScan employs a combination of tools to test and verify system security.
‘npm audit fix’, ‘npx expo-doctor’ and ‘expo install --check’ scans for outdated package.json dependencies and libraries that could introduce vulnerabilities. These tools and practices collectively enhance the app’s security posture and resilience against emerging threats.


## Initial Setup

```bash
# to remove any existing packages, clean setup
rm -rf node_modules package-lock.json

npm install

# to check app status
npx expo-doctor
npx expo install --check
```

## Run the App
**Start the development server:***
   ```bash
   npx expo start
   #or
   npx expo start --clear
   ```
**Open the app on your device with Expo Go or an emulator**
- Download/Install Expo SDK 52 App from the official expo website.
- Use Expo Go app on your physical device, then scan the QR code or manual input of the expo link.

## Development Commands

> **Note:** The following commands are for development reference only
> 
> <span style="color: red;">**DO NOT USE IT**</span>

```bash
npm outdated
npx npm-check-updates -u
npm audit fix
npm uninstall react-native-responsive-screen
npm install react-native-size-matters
rm -rf node_modules package-lock.json .expo .expo-shared metro-cache
```
