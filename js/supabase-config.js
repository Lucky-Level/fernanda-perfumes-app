// Fernanda Perfumes - Supabase Config
// Mesmo projeto do Barber Booking (owkvgdjcobmuacnztzee), tabelas com prefixo fp_
const SUPABASE_URL = 'https://owkvgdjcobmuacnztzee.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im93a3ZnZGpjb2JtdWFjbnp0emVlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU5OTkxNTQsImV4cCI6MjA5MTU3NTE1NH0.cvx4o9uFYOlVphl1_Sd8j8y-AxyCTi5xHxZHt0foyXI';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
