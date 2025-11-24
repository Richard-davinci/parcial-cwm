import {createClient} from '@supabase/supabase-js'

const SUPABASE_URL = 'https://zjapqwsywcctjswzxsik.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EGGEdpMYn-emz83WOws1pA_yj_yIkYw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);