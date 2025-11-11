'use client'

import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu'
import type { ComponentPropsWithoutRef, ElementRef } from 'react'
import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export const NavigationMenu = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Root>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Root
		ref={ref}
		className={cn('relative z-20 flex w-full items-center justify-center', className)}
		{...props}
	/>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

export const NavigationMenuList = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.List>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.List
		ref={ref}
		className={cn('group flex items-center justify-center gap-6', className)}
		{...props}
	/>
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

export const NavigationMenuItem = NavigationMenuPrimitive.Item

export const NavigationMenuTrigger = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Trigger>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Trigger
		ref={ref}
		className={cn(
			'group inline-flex h-10 items-center justify-center gap-1 rounded-md px-3 py-2 text-xl font-medium transition-colors focus:outline-none focus-visible:ring-yellow-400 focus-visible:ring-2',
			'hover:text-yellow-400 focus-visible:text-yellow-400 data-[state=open]:text-yellow-400',
			className,
		)}
		{...props}
	/>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

export const NavigationMenuContent = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Content>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Content
		ref={ref}
		className={cn(
			'absolute left-0 top-full z-20 mt-2 min-w-[12rem] rounded-lg border border-transparent bg-white p-4 shadow-lg',
			'data-[motion=from-start]:animate-enterFromLeft data-[motion=from-end]:animate-enterFromRight data-[motion=to-start]:animate-exitToLeft data-[motion=to-end]:animate-exitToRight',
			className,
		)}
		{...props}
	/>
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

export const NavigationMenuLink = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Link>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Link>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Link
		ref={ref}
		className={cn(
			'block rounded-md px-3 py-2 text-base transition-colors hover:bg-yellow-100 hover:text-yellow-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400',
			className,
		)}
		{...props}
	/>
))
NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName

export const NavigationMenuIndicator = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Indicator>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
	<NavigationMenuPrimitive.Indicator
		ref={ref}
		className={cn(
			'pointer-events-none absolute left-1/2 top-full z-30 flex h-2 -translate-x-1/2 items-end justify-center overflow-hidden',
			className,
		)}
		{...props}
	/>
))
NavigationMenuIndicator.displayName = NavigationMenuPrimitive.Indicator.displayName

export const NavigationMenuViewport = forwardRef<
	ElementRef<typeof NavigationMenuPrimitive.Viewport>,
	ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
	<div className='absolute left-0 top-full flex w-full justify-center'>
		<NavigationMenuPrimitive.Viewport
			ref={ref}
			className={cn(
				'mt-4 w-full origin-top overflow-hidden rounded-md border border-yellow-400 bg-white shadow-lg',
				'h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)]',
				className,
			)}
			{...props}
		/>
	</div>
))
NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName

export const navigationMenuTriggerStyle =
	'inline-flex h-10 items-center justify-center gap-1 rounded-md px-3 py-2 text-xl font-medium transition-colors hover:text-yellow-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400'

