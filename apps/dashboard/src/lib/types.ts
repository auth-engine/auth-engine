export interface UserResponse {
	id: string;
	email: string;
	username?: string;
	phone_number?: string | null;
	first_name?: string;
	last_name?: string;
	avatar_url?: string | null;
	status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
	is_email_verified: boolean;
	is_phone_verified: boolean;
	mfa_enabled: boolean;
	auth_strategies: string[];
	created_at: string;
	last_login_at?: string | null;
	roles: Array<{
		role: {
			id: string;
			name: string;
			description: string;
			scope: string;
			level: number;
			created_at: string;
			permissions: Array<{
				id: string;
				name: string;
				description?: string;
			}>;
			permission_ids: string[];
		};
		tenant_id: string;
	}>;
}

export interface AuthResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	user?: UserResponse;
}

export interface TenantOwner {
	id: string;
	email: string;
	first_name?: string;
	last_name?: string;
}

export interface TenantResponse {
	id: string;
	name: string;
	description?: string;
	type: string;
	owner_id: string;
	created_at?: string;
	updated_at?: string;
	owner?: TenantOwner;
}
export interface OAuthLoginResponse {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	is_new_user: boolean;
	provider: "google" | "github" | "microsoft" | "authengine";
}

export interface MFAChallengeResponse {
	mfa_pending_token: string;
	message: string;
}

export interface MFAEnrollmentRequiredResponse {
	mfa_enrollment_token: string;
	message: string;
}

export interface MFAEnrollResponse {
	provisioning_uri: string;
	secret: string;
	message?: string;
}

export interface ServiceKeyResponse {
	id: string;
	service_name: string;
	key_prefix: string;
	tenant_id?: string | null;
	is_active: boolean;
	created_by?: string | null;
	creator?: {
		id: string;
		email: string;
	} | null;
	created_at: string;
	last_used_at?: string | null;
	expires_at?: string | null;
	raw_key?: string; // Only present once on creation
}

export interface AuditLogEntry {
	id: string;
	_id?: string;
	action: string;
	actor_id?: string | null;
	target_user_id?: string | null;
	tenant_id?: string | null;
	resource?: string;
	resource_id?: string | null;
	resource_type?: string;
	ip_address?: string | null;
	user_agent?: string | null;
	status?: string;
	created_at: string;
	metadata?: Record<string, unknown> | null;
	details?: Record<string, unknown>;
}

export interface ContactLead {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	phone?: string;
	job_title?: string;
	company: string;
	company_size?: string;
	country?: string;
	mau?: string;
	interest?: string;
	message?: string;
	consent: boolean;
	created_at: string;
	source?: string;
	ip_address?: string;
	user_agent?: string;
}

export interface Permission {
	id: string;
	name: string;
	description?: string;
}

export interface Role {
	id: string;
	name: string;
	description: string;
	scope: string;
	level: number;
	tenant_id?: string | null;
	is_template?: boolean;
	template_role_id?: string | null;
	is_protected_tenant_role?: boolean;
	is_system_role?: boolean;
	is_name_locked?: boolean;
	created_at: string;
	permissions: Permission[];
	permission_ids: string[];
}

export interface PasswordPolicy {
	min_length: number;
	require_uppercase: boolean;
	require_lowercase: boolean;
	require_digit: boolean;
	require_special: boolean;
}

export interface TenantAuthConfig {
	id?: string;
	tenant_id?: string;
	allowed_methods: string[];
	mfa_required: boolean;
	password_policy: PasswordPolicy;
	session_ttl_seconds: number;
	allowed_domains: string[];
	oidc_client_id?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface PublicTenantAuthConfig {
	tenant_id: string;
	allowed_methods: string[];
}

export interface EmailConfigItem {
	id: string;
	tenant_id: string;
	provider: string;
	from_email: string;
	credential_hint: string;
	is_active: boolean;
}

export interface EmailConfigListResponse {
	items: EmailConfigItem[];
	available_providers: string[];
	using_platform_default: boolean;
	platform_provider?: string | null;
	platform_from_email?: string | null;
}

export interface SmsConfigItem {
	id: string;
	tenant_id: string;
	provider: string;
	from_number: string;
	credential_hint: string;
	account_sid?: string | null;
	is_active: boolean;
}

export interface SmsConfigListResponse {
	items: SmsConfigItem[];
	available_providers: string[];
	using_platform_default: boolean;
	platform_provider?: string | null;
	platform_from_number?: string | null;
}

export interface EmailConfigForm {
	provider: string;
	from_email: string;
	api_key: string;
	set_active: boolean;
}

export interface SmsConfigForm {
	provider: string;
	from_number: string;
	api_key: string;
	account_sid: string;
	set_active: boolean;
}

export interface OAuthProvider {
	id: string;
	name: string;
	enabled: boolean;
	client_id?: string;
	client_secret?: string;
}

export interface SocialProviderConfig {
	provider: string;
	client_id: string;
	client_secret: string;
	is_enabled: boolean;
}

export interface LinkedOAuthAccount {
	provider: string;
	provider_user_id: string;
	email?: string;
	linked_at: string;
}
