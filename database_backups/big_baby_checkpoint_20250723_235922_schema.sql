--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admin_notifications (
    id integer NOT NULL,
    heading character varying(200) NOT NULL,
    body text NOT NULL,
    image_url character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.admin_notifications OWNER TO neondb_owner;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admin_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admin_notifications_id_seq OWNER TO neondb_owner;

--
-- Name: admin_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admin_notifications_id_seq OWNED BY public.admin_notifications.id;


--
-- Name: billing_history; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.billing_history (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    invoice_number character varying(100) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    status character varying DEFAULT 'completed'::character varying,
    billing_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.billing_history OWNER TO neondb_owner;

--
-- Name: billing_history_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.billing_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.billing_history_id_seq OWNER TO neondb_owner;

--
-- Name: billing_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.billing_history_id_seq OWNED BY public.billing_history.id;


--
-- Name: blog_posts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.blog_posts (
    id integer NOT NULL,
    title character varying NOT NULL,
    slug character varying NOT NULL,
    excerpt text,
    content text NOT NULL,
    category character varying NOT NULL,
    tags text[],
    image_url character varying,
    read_time integer,
    published_at timestamp without time zone,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    pdf_url character varying,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    author character varying DEFAULT 'Daniel Golshevsky'::character varying NOT NULL,
    is_pinned boolean DEFAULT false,
    pinned_at timestamp without time zone
);


ALTER TABLE public.blog_posts OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.blog_posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.blog_posts_id_seq OWNER TO neondb_owner;

--
-- Name: blog_posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.blog_posts_id_seq OWNED BY public.blog_posts.id;


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.cart_items (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    item_type character varying NOT NULL,
    item_id integer NOT NULL,
    quantity integer DEFAULT 1,
    added_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO neondb_owner;

--
-- Name: cart_items_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.cart_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cart_items_id_seq OWNER TO neondb_owner;

--
-- Name: cart_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.cart_items_id_seq OWNED BY public.cart_items.id;


--
-- Name: children; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.children (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    name character varying NOT NULL,
    date_of_birth timestamp without time zone NOT NULL,
    gender character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    profile_picture character varying
);


ALTER TABLE public.children OWNER TO neondb_owner;

--
-- Name: children_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.children_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.children_id_seq OWNER TO neondb_owner;

--
-- Name: children_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.children_id_seq OWNED BY public.children.id;


--
-- Name: consultation_bookings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.consultation_bookings (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    consultation_type character varying NOT NULL,
    requested_date timestamp without time zone,
    status character varying DEFAULT 'pending'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.consultation_bookings OWNER TO neondb_owner;

--
-- Name: consultation_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.consultation_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.consultation_bookings_id_seq OWNER TO neondb_owner;

--
-- Name: consultation_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.consultation_bookings_id_seq OWNED BY public.consultation_bookings.id;


--
-- Name: course_chapters; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.course_chapters (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    chapter_number character varying NOT NULL,
    order_index integer NOT NULL,
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.course_chapters OWNER TO neondb_owner;

--
-- Name: course_chapters_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.course_chapters_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_chapters_id_seq OWNER TO neondb_owner;

--
-- Name: course_chapters_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.course_chapters_id_seq OWNED BY public.course_chapters.id;


--
-- Name: course_lessons; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.course_lessons (
    id integer NOT NULL,
    course_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    chapter_id integer,
    content_type character varying DEFAULT 'text'::character varying,
    duration integer,
    content text,
    video_url character varying,
    thumbnail_url character varying,
    updated_at timestamp without time zone DEFAULT now(),
    status character varying DEFAULT 'draft'::character varying NOT NULL
);


ALTER TABLE public.course_lessons OWNER TO neondb_owner;

--
-- Name: course_modules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.course_modules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_modules_id_seq OWNER TO neondb_owner;

--
-- Name: course_modules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.course_modules_id_seq OWNED BY public.course_lessons.id;


--
-- Name: course_purchases; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.course_purchases (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    course_id integer NOT NULL,
    stripe_payment_intent_id character varying,
    stripe_customer_id character varying,
    amount integer NOT NULL,
    currency character varying DEFAULT 'usd'::character varying,
    status character varying DEFAULT 'pending'::character varying,
    purchased_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    stripe_product_id character varying
);


ALTER TABLE public.course_purchases OWNER TO neondb_owner;

--
-- Name: course_purchases_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.course_purchases_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_purchases_id_seq OWNER TO neondb_owner;

--
-- Name: course_purchases_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.course_purchases_id_seq OWNED BY public.course_purchases.id;


--
-- Name: lesson_content; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lesson_content (
    id integer NOT NULL,
    lesson_id integer NOT NULL,
    title character varying NOT NULL,
    description text,
    video_url character varying,
    content text,
    duration integer,
    order_index integer NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lesson_content OWNER TO neondb_owner;

--
-- Name: course_submodules_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.course_submodules_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_submodules_id_seq OWNER TO neondb_owner;

--
-- Name: course_submodules_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.course_submodules_id_seq OWNED BY public.lesson_content.id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.courses (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    category character varying(100) NOT NULL,
    thumbnail_url character varying,
    video_url character varying,
    duration integer,
    age_range character varying,
    is_published boolean DEFAULT false,
    likes integer DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    price numeric(10,2),
    discounted_price numeric(10,2),
    skill_level character varying,
    stripe_product_id character varying,
    unique_id character varying,
    status character varying DEFAULT 'draft'::character varying NOT NULL,
    detailed_description text,
    website_content text,
    key_features text[],
    whats_covered text[],
    rating numeric(2,1) DEFAULT 4.8,
    review_count integer DEFAULT 0,
    overview_description text,
    learning_objectives text[],
    completion_criteria text,
    course_structure_notes text
);


ALTER TABLE public.courses OWNER TO neondb_owner;

--
-- Name: courses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.courses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_id_seq OWNER TO neondb_owner;

--
-- Name: courses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.courses_id_seq OWNED BY public.courses.id;


--
-- Name: development_milestones; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.development_milestones (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    video_url character varying,
    age_range_start integer,
    age_range_end integer,
    category character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.development_milestones OWNER TO neondb_owner;

--
-- Name: development_milestones_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.development_milestones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.development_milestones_id_seq OWNER TO neondb_owner;

--
-- Name: development_milestones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.development_milestones_id_seq OWNED BY public.development_milestones.id;


--
-- Name: development_tracking; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.development_tracking (
    id integer NOT NULL,
    child_id integer NOT NULL,
    milestone_id integer NOT NULL,
    status character varying NOT NULL,
    log_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now(),
    achieved_date timestamp without time zone
);


ALTER TABLE public.development_tracking OWNER TO neondb_owner;

--
-- Name: development_tracking_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.development_tracking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.development_tracking_id_seq OWNER TO neondb_owner;

--
-- Name: development_tracking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.development_tracking_id_seq OWNED BY public.development_tracking.id;


--
-- Name: family_invites; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.family_invites (
    id integer NOT NULL,
    family_owner_id character varying NOT NULL,
    invitee_email character varying NOT NULL,
    invitee_name character varying NOT NULL,
    invitee_role character varying NOT NULL,
    temp_password character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.family_invites OWNER TO neondb_owner;

--
-- Name: family_invites_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.family_invites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_invites_id_seq OWNER TO neondb_owner;

--
-- Name: family_invites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.family_invites_id_seq OWNED BY public.family_invites.id;


--
-- Name: family_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.family_members (
    id integer NOT NULL,
    family_owner_id character varying NOT NULL,
    member_id character varying NOT NULL,
    member_email character varying NOT NULL,
    member_name character varying NOT NULL,
    member_role character varying NOT NULL,
    status character varying DEFAULT 'active'::character varying,
    invited_at timestamp without time zone DEFAULT now(),
    joined_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.family_members OWNER TO neondb_owner;

--
-- Name: family_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.family_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.family_members_id_seq OWNER TO neondb_owner;

--
-- Name: family_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.family_members_id_seq OWNED BY public.family_members.id;


--
-- Name: feature_flags; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feature_flags (
    id integer NOT NULL,
    feature_name character varying(100) NOT NULL,
    description text,
    free_access boolean DEFAULT false,
    gold_access boolean DEFAULT false,
    platinum_access boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feature_flags OWNER TO neondb_owner;

--
-- Name: feature_flags_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feature_flags_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feature_flags_id_seq OWNER TO neondb_owner;

--
-- Name: feature_flags_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feature_flags_id_seq OWNED BY public.feature_flags.id;


--
-- Name: feed_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.feed_entries (
    id integer NOT NULL,
    child_id integer NOT NULL,
    feed_date timestamp without time zone DEFAULT now(),
    left_duration integer,
    right_duration integer,
    total_duration integer,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.feed_entries OWNER TO neondb_owner;

--
-- Name: feed_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.feed_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.feed_entries_id_seq OWNER TO neondb_owner;

--
-- Name: feed_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.feed_entries_id_seq OWNED BY public.feed_entries.id;


--
-- Name: growth_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.growth_entries (
    id integer NOT NULL,
    child_id integer NOT NULL,
    measurement_type character varying NOT NULL,
    value numeric(10,2) NOT NULL,
    unit character varying NOT NULL,
    percentile numeric(5,2),
    log_date timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.growth_entries OWNER TO neondb_owner;

--
-- Name: growth_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.growth_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.growth_entries_id_seq OWNER TO neondb_owner;

--
-- Name: growth_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.growth_entries_id_seq OWNED BY public.growth_entries.id;


--
-- Name: lead_captures; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.lead_captures (
    id integer NOT NULL,
    first_name character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    freebie_id integer NOT NULL,
    top_of_funnel_nurture boolean DEFAULT true,
    klaviyo_profile_id character varying(255),
    ip_address character varying(45),
    user_agent text,
    referrer_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.lead_captures OWNER TO neondb_owner;

--
-- Name: lead_captures_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.lead_captures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lead_captures_id_seq OWNER TO neondb_owner;

--
-- Name: lead_captures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.lead_captures_id_seq OWNED BY public.lead_captures.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info'::text NOT NULL,
    category text DEFAULT 'system'::text NOT NULL,
    priority text DEFAULT 'normal'::text NOT NULL,
    is_read boolean DEFAULT false,
    action_text text,
    action_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    read_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    target_type character varying(50) DEFAULT 'global'::character varying,
    target_users text[],
    target_tiers text[],
    is_scheduled boolean DEFAULT false,
    scheduled_for timestamp without time zone,
    is_automated boolean DEFAULT false,
    automation_trigger character varying(100),
    is_active boolean DEFAULT true,
    is_published boolean DEFAULT true,
    published_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone,
    total_sent integer DEFAULT 0,
    total_read integer DEFAULT 0,
    created_by character varying(255)
);


ALTER TABLE public.notifications OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO neondb_owner;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: partner_discounts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.partner_discounts (
    id integer NOT NULL,
    partner_name character varying(255) NOT NULL,
    logo_url character varying,
    description text,
    discount_code character varying(100) NOT NULL,
    discount_percentage integer,
    discount_amount numeric(10,2),
    is_active boolean DEFAULT true,
    required_tier character varying DEFAULT 'gold'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.partner_discounts OWNER TO neondb_owner;

--
-- Name: partner_discounts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.partner_discounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.partner_discounts_id_seq OWNER TO neondb_owner;

--
-- Name: partner_discounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.partner_discounts_id_seq OWNED BY public.partner_discounts.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying NOT NULL,
    description text,
    product_type character varying NOT NULL,
    category character varying NOT NULL,
    price numeric(10,2) NOT NULL,
    currency character varying DEFAULT 'AUD'::character varying,
    checkout_link character varying NOT NULL,
    legacy_checkout_link character varying,
    stripe_product_id character varying,
    stripe_price_id character varying,
    course_id integer,
    subscription_tier character varying,
    billing_period character varying,
    age_range character varying,
    duration integer,
    features text[],
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    thumbnail_url character varying,
    metadata jsonb
);


ALTER TABLE public.products OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO neondb_owner;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: regional_pricing; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.regional_pricing (
    id integer NOT NULL,
    region character varying(50) NOT NULL,
    currency character varying(3) NOT NULL,
    course_price numeric(10,2) NOT NULL,
    gold_monthly numeric(10,2) NOT NULL,
    gold_yearly numeric(10,2) NOT NULL,
    platinum_monthly numeric(10,2) NOT NULL,
    platinum_yearly numeric(10,2) NOT NULL,
    country_list text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    book1_price numeric(10,2) DEFAULT 30.00,
    book2_price numeric(10,2) DEFAULT 30.00
);


ALTER TABLE public.regional_pricing OWNER TO neondb_owner;

--
-- Name: regional_pricing_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.regional_pricing_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.regional_pricing_id_seq OWNER TO neondb_owner;

--
-- Name: regional_pricing_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.regional_pricing_id_seq OWNED BY public.regional_pricing.id;


--
-- Name: service_bookings; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.service_bookings (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    service_id integer NOT NULL,
    preferred_date timestamp without time zone NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    preferred_time character varying(10) DEFAULT '09:00'::character varying NOT NULL,
    concerns text,
    confirmation_code character varying(50),
    meeting_link character varying(255),
    meeting_notes text,
    reminder_sent boolean DEFAULT false,
    reminder_sent_at timestamp without time zone
);


ALTER TABLE public.service_bookings OWNER TO neondb_owner;

--
-- Name: service_bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.service_bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.service_bookings_id_seq OWNER TO neondb_owner;

--
-- Name: service_bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.service_bookings_id_seq OWNED BY public.service_bookings.id;


--
-- Name: services; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.services (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    service_type character varying(100) NOT NULL,
    price numeric(10,2) NOT NULL,
    duration integer,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    currency character varying(3) DEFAULT 'USD'::character varying NOT NULL,
    what_to_expect text,
    who_is_it_for text,
    benefits text[],
    includes text[],
    max_advance_booking_days integer DEFAULT 30,
    min_advance_booking_hours integer DEFAULT 24,
    available_days text[],
    available_time_slots text[],
    image_url character varying,
    icon_name character varying
);


ALTER TABLE public.services OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.services_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.services_id_seq OWNER TO neondb_owner;

--
-- Name: services_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.services_id_seq OWNED BY public.services.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO neondb_owner;

--
-- Name: shopping_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.shopping_products (
    id integer NOT NULL,
    title character varying NOT NULL,
    author character varying,
    description text,
    category character varying NOT NULL,
    stripe_product_id character varying NOT NULL,
    stripe_price_aud_id character varying NOT NULL,
    stripe_price_usd_id character varying NOT NULL,
    stripe_price_eur_id character varying,
    price_field character varying NOT NULL,
    rating numeric(2,1),
    review_count integer DEFAULT 0,
    image_url character varying,
    amazon_url character varying,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    in_stock boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.shopping_products OWNER TO neondb_owner;

--
-- Name: shopping_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.shopping_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.shopping_products_id_seq OWNER TO neondb_owner;

--
-- Name: shopping_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.shopping_products_id_seq OWNED BY public.shopping_products.id;


--
-- Name: sleep_entries; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sleep_entries (
    id integer NOT NULL,
    child_id integer NOT NULL,
    sleep_date timestamp without time zone DEFAULT now(),
    start_time timestamp without time zone NOT NULL,
    end_time timestamp without time zone,
    duration integer,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    quality character varying
);


ALTER TABLE public.sleep_entries OWNER TO neondb_owner;

--
-- Name: sleep_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sleep_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sleep_entries_id_seq OWNER TO neondb_owner;

--
-- Name: sleep_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sleep_entries_id_seq OWNED BY public.sleep_entries.id;


--
-- Name: stripe_products; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stripe_products (
    id integer NOT NULL,
    stripe_product_id character varying NOT NULL,
    stripe_price_id character varying NOT NULL,
    name character varying NOT NULL,
    description text,
    statement_descriptor character varying,
    purchase_category character varying NOT NULL,
    type character varying NOT NULL,
    amount integer,
    currency character varying DEFAULT 'usd'::character varying,
    billing_interval character varying,
    is_active boolean DEFAULT true,
    course_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stripe_products OWNER TO neondb_owner;

--
-- Name: stripe_products_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stripe_products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stripe_products_id_seq OWNER TO neondb_owner;

--
-- Name: stripe_products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stripe_products_id_seq OWNED BY public.stripe_products.id;


--
-- Name: temporary_passwords; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.temporary_passwords (
    id integer NOT NULL,
    user_id character varying,
    temp_password character varying NOT NULL,
    is_used boolean DEFAULT false,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.temporary_passwords OWNER TO neondb_owner;

--
-- Name: temporary_passwords_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.temporary_passwords_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.temporary_passwords_id_seq OWNER TO neondb_owner;

--
-- Name: temporary_passwords_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.temporary_passwords_id_seq OWNED BY public.temporary_passwords.id;


--
-- Name: userNotifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."userNotifications" (
    id integer NOT NULL,
    "userId" character varying(255) NOT NULL,
    "notificationId" integer NOT NULL,
    "isRead" boolean DEFAULT false,
    "readAt" timestamp without time zone,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public."userNotifications" OWNER TO neondb_owner;

--
-- Name: userNotifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public."userNotifications_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."userNotifications_id_seq" OWNER TO neondb_owner;

--
-- Name: userNotifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public."userNotifications_id_seq" OWNED BY public."userNotifications".id;


--
-- Name: user_chapter_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_chapter_progress (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    chapter_id integer NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_chapter_progress OWNER TO neondb_owner;

--
-- Name: user_chapter_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_chapter_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_chapter_progress_id_seq OWNER TO neondb_owner;

--
-- Name: user_chapter_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_chapter_progress_id_seq OWNED BY public.user_chapter_progress.id;


--
-- Name: user_course_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_course_progress (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    course_id integer NOT NULL,
    is_completed boolean DEFAULT false,
    progress integer DEFAULT 0,
    last_watched timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_course_progress OWNER TO neondb_owner;

--
-- Name: user_course_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_course_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_course_progress_id_seq OWNER TO neondb_owner;

--
-- Name: user_course_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_course_progress_id_seq OWNED BY public.user_course_progress.id;


--
-- Name: user_lesson_content_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_lesson_content_progress (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    lesson_content_id integer NOT NULL,
    completed boolean DEFAULT false,
    watch_time integer DEFAULT 0,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_lesson_content_progress OWNER TO neondb_owner;

--
-- Name: user_lesson_progress; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_lesson_progress (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    lesson_id integer NOT NULL,
    completed boolean DEFAULT false,
    watch_time integer DEFAULT 0,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_lesson_progress OWNER TO neondb_owner;

--
-- Name: user_module_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_module_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_module_progress_id_seq OWNER TO neondb_owner;

--
-- Name: user_module_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_module_progress_id_seq OWNED BY public.user_lesson_progress.id;


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.user_notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    notification_id integer NOT NULL,
    is_read boolean DEFAULT false,
    is_clicked boolean DEFAULT false,
    read_at timestamp without time zone,
    clicked_at timestamp without time zone,
    delivered_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.user_notifications OWNER TO neondb_owner;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_notifications_id_seq OWNER TO neondb_owner;

--
-- Name: user_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_notifications_id_seq OWNED BY public.user_notifications.id;


--
-- Name: user_submodule_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.user_submodule_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_submodule_progress_id_seq OWNER TO neondb_owner;

--
-- Name: user_submodule_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.user_submodule_progress_id_seq OWNED BY public.user_lesson_content_progress.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.users (
    id character varying NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    subscription_tier character varying DEFAULT 'free'::character varying NOT NULL,
    subscription_status character varying DEFAULT 'active'::character varying NOT NULL,
    next_billing_date timestamp without time zone,
    billing_period character varying DEFAULT 'monthly'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    country character varying,
    phone character varying,
    signup_source character varying,
    migrated boolean DEFAULT false,
    choose_plan character varying DEFAULT 'free'::character varying,
    count_courses integer DEFAULT 0,
    courses_purchased_previously text,
    sign_in_count integer DEFAULT 0,
    last_sign_in timestamp without time zone,
    stripe_customer_id character varying,
    is_admin boolean DEFAULT false,
    temporary_password character varying,
    is_first_login boolean DEFAULT true,
    has_set_password boolean DEFAULT false,
    password_hash character varying,
    last_password_change timestamp without time zone,
    onboarding_completed boolean DEFAULT false,
    primary_concerns text,
    phone_number character varying,
    profile_picture_url character varying,
    user_role character varying,
    accepted_terms boolean DEFAULT false,
    marketing_opt_in boolean DEFAULT false,
    new_member_offer_shown boolean DEFAULT false,
    new_member_offer_accepted boolean DEFAULT false,
    stripe_subscription_id character varying,
    last_login_at timestamp without time zone,
    sms_marketing_opt_in boolean DEFAULT false,
    first_child_dob timestamp without time zone,
    account_activated boolean DEFAULT false,
    activated_services text[] DEFAULT '{}'::text[],
    password_set character varying DEFAULT 'no'::character varying
);


ALTER TABLE public.users OWNER TO neondb_owner;

--
-- Name: admin_notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_notifications ALTER COLUMN id SET DEFAULT nextval('public.admin_notifications_id_seq'::regclass);


--
-- Name: billing_history id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_history ALTER COLUMN id SET DEFAULT nextval('public.billing_history_id_seq'::regclass);


--
-- Name: blog_posts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts ALTER COLUMN id SET DEFAULT nextval('public.blog_posts_id_seq'::regclass);


--
-- Name: cart_items id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items ALTER COLUMN id SET DEFAULT nextval('public.cart_items_id_seq'::regclass);


--
-- Name: children id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.children ALTER COLUMN id SET DEFAULT nextval('public.children_id_seq'::regclass);


--
-- Name: consultation_bookings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consultation_bookings ALTER COLUMN id SET DEFAULT nextval('public.consultation_bookings_id_seq'::regclass);


--
-- Name: course_chapters id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_chapters ALTER COLUMN id SET DEFAULT nextval('public.course_chapters_id_seq'::regclass);


--
-- Name: course_lessons id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_lessons ALTER COLUMN id SET DEFAULT nextval('public.course_modules_id_seq'::regclass);


--
-- Name: course_purchases id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases ALTER COLUMN id SET DEFAULT nextval('public.course_purchases_id_seq'::regclass);


--
-- Name: courses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.courses ALTER COLUMN id SET DEFAULT nextval('public.courses_id_seq'::regclass);


--
-- Name: development_milestones id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_milestones ALTER COLUMN id SET DEFAULT nextval('public.development_milestones_id_seq'::regclass);


--
-- Name: development_tracking id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_tracking ALTER COLUMN id SET DEFAULT nextval('public.development_tracking_id_seq'::regclass);


--
-- Name: family_invites id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_invites ALTER COLUMN id SET DEFAULT nextval('public.family_invites_id_seq'::regclass);


--
-- Name: family_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_members ALTER COLUMN id SET DEFAULT nextval('public.family_members_id_seq'::regclass);


--
-- Name: feature_flags id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags ALTER COLUMN id SET DEFAULT nextval('public.feature_flags_id_seq'::regclass);


--
-- Name: feed_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feed_entries ALTER COLUMN id SET DEFAULT nextval('public.feed_entries_id_seq'::regclass);


--
-- Name: growth_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.growth_entries ALTER COLUMN id SET DEFAULT nextval('public.growth_entries_id_seq'::regclass);


--
-- Name: lead_captures id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_captures ALTER COLUMN id SET DEFAULT nextval('public.lead_captures_id_seq'::regclass);


--
-- Name: lesson_content id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_content ALTER COLUMN id SET DEFAULT nextval('public.course_submodules_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: partner_discounts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_discounts ALTER COLUMN id SET DEFAULT nextval('public.partner_discounts_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: regional_pricing id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.regional_pricing ALTER COLUMN id SET DEFAULT nextval('public.regional_pricing_id_seq'::regclass);


--
-- Name: service_bookings id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.service_bookings ALTER COLUMN id SET DEFAULT nextval('public.service_bookings_id_seq'::regclass);


--
-- Name: services id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services ALTER COLUMN id SET DEFAULT nextval('public.services_id_seq'::regclass);


--
-- Name: shopping_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products ALTER COLUMN id SET DEFAULT nextval('public.shopping_products_id_seq'::regclass);


--
-- Name: sleep_entries id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sleep_entries ALTER COLUMN id SET DEFAULT nextval('public.sleep_entries_id_seq'::regclass);


--
-- Name: stripe_products id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_products ALTER COLUMN id SET DEFAULT nextval('public.stripe_products_id_seq'::regclass);


--
-- Name: temporary_passwords id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temporary_passwords ALTER COLUMN id SET DEFAULT nextval('public.temporary_passwords_id_seq'::regclass);


--
-- Name: userNotifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."userNotifications" ALTER COLUMN id SET DEFAULT nextval('public."userNotifications_id_seq"'::regclass);


--
-- Name: user_chapter_progress id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_chapter_progress ALTER COLUMN id SET DEFAULT nextval('public.user_chapter_progress_id_seq'::regclass);


--
-- Name: user_course_progress id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_course_progress ALTER COLUMN id SET DEFAULT nextval('public.user_course_progress_id_seq'::regclass);


--
-- Name: user_lesson_content_progress id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_content_progress ALTER COLUMN id SET DEFAULT nextval('public.user_submodule_progress_id_seq'::regclass);


--
-- Name: user_lesson_progress id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_progress ALTER COLUMN id SET DEFAULT nextval('public.user_module_progress_id_seq'::regclass);


--
-- Name: user_notifications id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_notifications ALTER COLUMN id SET DEFAULT nextval('public.user_notifications_id_seq'::regclass);


--
-- Name: admin_notifications admin_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admin_notifications
    ADD CONSTRAINT admin_notifications_pkey PRIMARY KEY (id);


--
-- Name: billing_history billing_history_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);


--
-- Name: blog_posts blog_posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: children children_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_pkey PRIMARY KEY (id);


--
-- Name: consultation_bookings consultation_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consultation_bookings
    ADD CONSTRAINT consultation_bookings_pkey PRIMARY KEY (id);


--
-- Name: course_chapters course_chapters_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_chapters
    ADD CONSTRAINT course_chapters_pkey PRIMARY KEY (id);


--
-- Name: course_lessons course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: course_purchases course_purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_pkey PRIMARY KEY (id);


--
-- Name: course_purchases course_purchases_stripe_payment_intent_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_stripe_payment_intent_id_unique UNIQUE (stripe_payment_intent_id);


--
-- Name: lesson_content course_submodules_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_content
    ADD CONSTRAINT course_submodules_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: development_milestones development_milestones_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_milestones
    ADD CONSTRAINT development_milestones_pkey PRIMARY KEY (id);


--
-- Name: development_tracking development_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_tracking
    ADD CONSTRAINT development_tracking_pkey PRIMARY KEY (id);


--
-- Name: family_invites family_invites_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_pkey PRIMARY KEY (id);


--
-- Name: family_members family_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_pkey PRIMARY KEY (id);


--
-- Name: feature_flags feature_flags_feature_name_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_feature_name_unique UNIQUE (feature_name);


--
-- Name: feature_flags feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feature_flags
    ADD CONSTRAINT feature_flags_pkey PRIMARY KEY (id);


--
-- Name: feed_entries feed_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feed_entries
    ADD CONSTRAINT feed_entries_pkey PRIMARY KEY (id);


--
-- Name: growth_entries growth_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.growth_entries
    ADD CONSTRAINT growth_entries_pkey PRIMARY KEY (id);


--
-- Name: lead_captures lead_captures_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_captures
    ADD CONSTRAINT lead_captures_email_unique UNIQUE (email);


--
-- Name: lead_captures lead_captures_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lead_captures
    ADD CONSTRAINT lead_captures_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: partner_discounts partner_discounts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.partner_discounts
    ADD CONSTRAINT partner_discounts_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_stripe_product_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_stripe_product_id_key UNIQUE (stripe_product_id);


--
-- Name: regional_pricing regional_pricing_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.regional_pricing
    ADD CONSTRAINT regional_pricing_pkey PRIMARY KEY (id);


--
-- Name: service_bookings service_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.service_bookings
    ADD CONSTRAINT service_bookings_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: shopping_products shopping_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products
    ADD CONSTRAINT shopping_products_pkey PRIMARY KEY (id);


--
-- Name: shopping_products shopping_products_stripe_price_aud_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products
    ADD CONSTRAINT shopping_products_stripe_price_aud_id_key UNIQUE (stripe_price_aud_id);


--
-- Name: shopping_products shopping_products_stripe_price_eur_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products
    ADD CONSTRAINT shopping_products_stripe_price_eur_id_key UNIQUE (stripe_price_eur_id);


--
-- Name: shopping_products shopping_products_stripe_price_usd_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products
    ADD CONSTRAINT shopping_products_stripe_price_usd_id_key UNIQUE (stripe_price_usd_id);


--
-- Name: shopping_products shopping_products_stripe_product_id_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.shopping_products
    ADD CONSTRAINT shopping_products_stripe_product_id_key UNIQUE (stripe_product_id);


--
-- Name: sleep_entries sleep_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sleep_entries
    ADD CONSTRAINT sleep_entries_pkey PRIMARY KEY (id);


--
-- Name: stripe_products stripe_products_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_products
    ADD CONSTRAINT stripe_products_pkey PRIMARY KEY (id);


--
-- Name: stripe_products stripe_products_stripe_price_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_products
    ADD CONSTRAINT stripe_products_stripe_price_id_unique UNIQUE (stripe_price_id);


--
-- Name: stripe_products stripe_products_stripe_product_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_products
    ADD CONSTRAINT stripe_products_stripe_product_id_unique UNIQUE (stripe_product_id);


--
-- Name: temporary_passwords temporary_passwords_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temporary_passwords
    ADD CONSTRAINT temporary_passwords_pkey PRIMARY KEY (id);


--
-- Name: user_notifications unique_user_notification; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT unique_user_notification UNIQUE (user_id, notification_id);


--
-- Name: userNotifications userNotifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."userNotifications"
    ADD CONSTRAINT "userNotifications_pkey" PRIMARY KEY (id);


--
-- Name: userNotifications userNotifications_userId_notificationId_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."userNotifications"
    ADD CONSTRAINT "userNotifications_userId_notificationId_unique" UNIQUE ("userId", "notificationId");


--
-- Name: user_chapter_progress user_chapter_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_chapter_progress
    ADD CONSTRAINT user_chapter_progress_pkey PRIMARY KEY (id);


--
-- Name: user_course_progress user_course_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_course_progress
    ADD CONSTRAINT user_course_progress_pkey PRIMARY KEY (id);


--
-- Name: user_course_progress user_course_progress_user_id_course_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_course_progress
    ADD CONSTRAINT user_course_progress_user_id_course_id_unique UNIQUE (user_id, course_id);


--
-- Name: user_lesson_progress user_lesson_progress_user_id_lesson_id_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_lesson_progress_user_id_lesson_id_unique UNIQUE (user_id, lesson_id);


--
-- Name: user_lesson_progress user_module_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_module_progress_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_lesson_content_progress user_submodule_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_content_progress
    ADD CONSTRAINT user_submodule_progress_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: idx_cart_items_unique; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE UNIQUE INDEX idx_cart_items_unique ON public.cart_items USING btree (user_id, item_type, item_id);


--
-- Name: idx_cart_items_user_id; Type: INDEX; Schema: public; Owner: neondb_owner
--

CREATE INDEX idx_cart_items_user_id ON public.cart_items USING btree (user_id);


--
-- Name: billing_history billing_history_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.billing_history
    ADD CONSTRAINT billing_history_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: cart_items cart_items_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: children children_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.children
    ADD CONSTRAINT children_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: consultation_bookings consultation_bookings_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.consultation_bookings
    ADD CONSTRAINT consultation_bookings_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: course_chapters course_chapters_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_chapters
    ADD CONSTRAINT course_chapters_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_lessons course_modules_chapter_id_course_chapters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_modules_chapter_id_course_chapters_id_fk FOREIGN KEY (chapter_id) REFERENCES public.course_chapters(id);


--
-- Name: course_lessons course_modules_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_lessons
    ADD CONSTRAINT course_modules_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_purchases course_purchases_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: course_purchases course_purchases_stripe_product_id_stripe_products_stripe_produ; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_stripe_product_id_stripe_products_stripe_produ FOREIGN KEY (stripe_product_id) REFERENCES public.stripe_products(stripe_product_id);


--
-- Name: course_purchases course_purchases_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.course_purchases
    ADD CONSTRAINT course_purchases_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: lesson_content course_submodules_module_id_course_modules_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.lesson_content
    ADD CONSTRAINT course_submodules_module_id_course_modules_id_fk FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id);


--
-- Name: development_tracking development_tracking_child_id_children_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_tracking
    ADD CONSTRAINT development_tracking_child_id_children_id_fk FOREIGN KEY (child_id) REFERENCES public.children(id);


--
-- Name: development_tracking development_tracking_milestone_id_development_milestones_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.development_tracking
    ADD CONSTRAINT development_tracking_milestone_id_development_milestones_id_fk FOREIGN KEY (milestone_id) REFERENCES public.development_milestones(id);


--
-- Name: family_invites family_invites_family_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_invites
    ADD CONSTRAINT family_invites_family_owner_id_users_id_fk FOREIGN KEY (family_owner_id) REFERENCES public.users(id);


--
-- Name: family_members family_members_family_owner_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_family_owner_id_users_id_fk FOREIGN KEY (family_owner_id) REFERENCES public.users(id);


--
-- Name: family_members family_members_member_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.family_members
    ADD CONSTRAINT family_members_member_id_users_id_fk FOREIGN KEY (member_id) REFERENCES public.users(id);


--
-- Name: feed_entries feed_entries_child_id_children_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.feed_entries
    ADD CONSTRAINT feed_entries_child_id_children_id_fk FOREIGN KEY (child_id) REFERENCES public.children(id);


--
-- Name: growth_entries growth_entries_child_id_children_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.growth_entries
    ADD CONSTRAINT growth_entries_child_id_children_id_fk FOREIGN KEY (child_id) REFERENCES public.children(id);


--
-- Name: service_bookings service_bookings_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.service_bookings
    ADD CONSTRAINT service_bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;


--
-- Name: sleep_entries sleep_entries_child_id_children_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sleep_entries
    ADD CONSTRAINT sleep_entries_child_id_children_id_fk FOREIGN KEY (child_id) REFERENCES public.children(id);


--
-- Name: stripe_products stripe_products_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stripe_products
    ADD CONSTRAINT stripe_products_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: temporary_passwords temporary_passwords_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.temporary_passwords
    ADD CONSTRAINT temporary_passwords_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: userNotifications userNotifications_notificationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public."userNotifications"
    ADD CONSTRAINT "userNotifications_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: user_chapter_progress user_chapter_progress_chapter_id_course_chapters_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_chapter_progress
    ADD CONSTRAINT user_chapter_progress_chapter_id_course_chapters_id_fk FOREIGN KEY (chapter_id) REFERENCES public.course_chapters(id);


--
-- Name: user_chapter_progress user_chapter_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_chapter_progress
    ADD CONSTRAINT user_chapter_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_course_progress user_course_progress_course_id_courses_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_course_progress
    ADD CONSTRAINT user_course_progress_course_id_courses_id_fk FOREIGN KEY (course_id) REFERENCES public.courses(id);


--
-- Name: user_course_progress user_course_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_course_progress
    ADD CONSTRAINT user_course_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_lesson_progress user_module_progress_module_id_course_modules_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_module_progress_module_id_course_modules_id_fk FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id);


--
-- Name: user_lesson_progress user_module_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_progress
    ADD CONSTRAINT user_module_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_lesson_content_progress user_submodule_progress_submodule_id_course_submodules_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_content_progress
    ADD CONSTRAINT user_submodule_progress_submodule_id_course_submodules_id_fk FOREIGN KEY (lesson_content_id) REFERENCES public.lesson_content(id);


--
-- Name: user_lesson_content_progress user_submodule_progress_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.user_lesson_content_progress
    ADD CONSTRAINT user_submodule_progress_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

