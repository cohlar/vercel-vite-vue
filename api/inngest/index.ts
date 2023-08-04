import { inngest } from './client'
import { helloWorld } from './functions/helloWorld'
import { serve } from './serve'

export default serve(inngest, [helloWorld])
