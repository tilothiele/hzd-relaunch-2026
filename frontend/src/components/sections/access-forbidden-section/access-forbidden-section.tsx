import Image from 'next/image'

export default function AccessForbiddenSection() {
    return (
        <div className='flex w-full justify-center px-6 py-24'>
            <section className='grid min-h-[50vh] w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2'>
                <div className='flex items-center justify-center px-6' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
                    <Image
                        src='/static-images/404-not-found-wuff.jpg'
                        alt='403 - Zugriff verweigert'
                        width={300}
                        height={300}
                        className='rounded-lg object-contain'
                        unoptimized
                    />
                </div>
                <div className='flex flex-col items-center justify-center gap-6 px-6 text-center md:text-left'>
                    <h1 className='text-4xl font-semibold tracking-tight text-neutral-900'>
                        Zugriff verweigert
                    </h1>
                    <p className='max-w-lg text-base text-neutral-600'>
                        Sie haben keine Berechtigung, diese Seite aufzurufen. Bitte melden Sie sich an oder wenden Sie sich an den Administrator.
                    </p>
                </div>
            </section>
        </div>
    )
}
