-- Initialize Masterminds database schema
-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table with embedding column for interests
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    bio TEXT,
    avatar_url VARCHAR(500),
    interests_embedding vector(1536), -- OpenAI embedding dimension
    reputation_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    stripe_customer_id VARCHAR(255),
    stripe_connect_account_id VARCHAR(255)
);

-- Groups table with semantic routing capabilities  
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    topic_embedding vector(1536),
    member_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_private BOOLEAN DEFAULT false
);

-- Questions table with bounty and SLA tracking
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    embedding vector(1536),
    author_id UUID REFERENCES users(id) NOT NULL,
    group_id UUID REFERENCES groups(id),
    bounty_amount INTEGER DEFAULT 0, -- in cents
    sla_deadline TIMESTAMP,
    status VARCHAR(50) DEFAULT 'open', -- open, answered, closed, expired
    view_count INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_answer_id UUID,
    tags TEXT[]
);

-- Answers table with quality scoring
CREATE TABLE answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) NOT NULL,
    author_id UUID REFERENCES users(id) NOT NULL,
    body TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    quality_score DECIMAL(3,2) DEFAULT 0.0,
    is_accepted BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    ai_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reputation events with decay factors
CREATE TABLE reputation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    group_id UUID REFERENCES groups(id),
    event_type VARCHAR(50) NOT NULL, -- question_upvote, answer_accepted, etc.
    points_change INTEGER NOT NULL,
    decay_factor DECIMAL(3,2) DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    related_question_id UUID REFERENCES questions(id),
    related_answer_id UUID REFERENCES answers(id)
);

-- Escrow transactions for Stripe integration
CREATE TABLE escrow_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES questions(id) NOT NULL,
    payer_id UUID REFERENCES users(id) NOT NULL,
    payee_id UUID REFERENCES users(id),
    amount INTEGER NOT NULL, -- in cents
    platform_fee INTEGER NOT NULL, -- in cents
    stripe_payment_intent_id VARCHAR(255),
    stripe_transfer_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, held, released, refunded
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMP,
    refunded_at TIMESTAMP
);

-- Semantic routes for AI routing configuration
CREATE TABLE semantic_routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_name VARCHAR(255) NOT NULL,
    group_id UUID REFERENCES groups(id) NOT NULL,
    keywords TEXT[],
    embedding vector(1536),
    confidence_threshold DECIMAL(3,2) DEFAULT 0.8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- User group memberships
CREATE TABLE user_group_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    group_id UUID REFERENCES groups(id) NOT NULL,
    role VARCHAR(50) DEFAULT 'member', -- member, moderator, admin
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, group_id)
);

-- Votes tracking
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    question_id UUID REFERENCES questions(id),
    answer_id UUID REFERENCES answers(id),
    vote_type VARCHAR(10) NOT NULL, -- upvote, downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT votes_target_check CHECK (
        (question_id IS NOT NULL AND answer_id IS NULL) OR
        (question_id IS NULL AND answer_id IS NOT NULL)
    ),
    UNIQUE(user_id, question_id, answer_id)
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_questions_author_id ON questions(author_id);
CREATE INDEX idx_questions_group_id ON questions(group_id);
CREATE INDEX idx_questions_status ON questions(status);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_author_id ON answers(author_id);
CREATE INDEX idx_reputation_events_user_id ON reputation_events(user_id);
CREATE INDEX idx_escrow_transactions_question_id ON escrow_transactions(question_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_question_id ON votes(question_id);
CREATE INDEX idx_votes_answer_id ON votes(answer_id);

-- Vector indexes for semantic search
CREATE INDEX idx_questions_embedding ON questions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_users_interests_embedding ON users USING ivfflat (interests_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_groups_topic_embedding ON groups USING ivfflat (topic_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_semantic_routes_embedding ON semantic_routes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Add foreign key for accepted answers
ALTER TABLE questions ADD CONSTRAINT fk_questions_accepted_answer 
    FOREIGN KEY (accepted_answer_id) REFERENCES answers(id);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at BEFORE UPDATE ON answers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data
INSERT INTO users (email, username, password_hash, full_name, bio) VALUES
    ('admin@masterminds.com', 'admin', '$2b$10$dummy.hash.for.dev.only', 'System Administrator', 'Platform administrator'),
    ('alice@example.com', 'alice_dev', '$2b$10$dummy.hash.for.dev.only', 'Alice Johnson', 'Full-stack developer with 5+ years experience'),
    ('bob@example.com', 'bob_data', '$2b$10$dummy.hash.for.dev.only', 'Bob Smith', 'Data scientist passionate about ML');

INSERT INTO groups (name, description, category, created_by) VALUES
    ('Web Development', 'Discuss web technologies, frameworks, and best practices', 'Technology', (SELECT id FROM users WHERE username = 'admin')),
    ('Data Science', 'Share insights about data analysis, ML, and statistics', 'Data', (SELECT id FROM users WHERE username = 'admin')),
    ('Career Advice', 'Professional development and career guidance', 'Professional', (SELECT id FROM users WHERE username = 'admin'));