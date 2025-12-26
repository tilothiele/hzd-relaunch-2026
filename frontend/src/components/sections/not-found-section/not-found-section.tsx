import Image from 'next/image'

export default function NotFoundSection() {
    return (
        <div className='flex w-full justify-center px-6 py-24'>
            <section className='grid min-h-[50vh] w-full max-w-6xl grid-cols-1 gap-8 md:grid-cols-2'>
                <div className='flex items-center justify-center px-6' style={{ paddingTop: '1em', paddingBottom: '1em' }}>
                    <Image
                        src='/static-images/404-not-found-wuff.jpg'
                        alt='404 - Seite nicht gefunden'
                        width={300}
                        height={300}
                        className='rounded-lg object-cover'
                        unoptimized
                    />
                </div>
                <div className='flex flex-col items-center justify-center gap-6 px-6 text-center md:text-left'>
                    <h1 className='text-4xl font-semibold tracking-tight text-neutral-900'>
                        Seite nicht gefunden
                    </h1>
                    <p className='max-w-lg text-base text-neutral-600'>
                        Die angeforderte Seite konnte nicht gefunden werden. Bitte prüfen Sie die
                        URL oder kehren Sie zur Startseite zurück.
                    </p>
                </div>
            </section>
        </div>
    )
}

