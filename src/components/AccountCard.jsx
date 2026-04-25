import React from 'react';
import { Star, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AccountCard = ({ account }) => {
  return (
    <Link to={`/listing/${account.id}`} className="group glass-panel overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col h-full bg-[#181c2e] border border-gray-800 block">
      
      {/* Thumbnail & Seller Info Overlay */}
      <div className="relative h-40 overflow-hidden bg-gray-900">
        <img 
          src={account.thumbnail} 
          alt={account.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#181c2e] to-transparent"></div>
        
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-white border border-gray-800">
                {account.seller.name.charAt(0)}
              </div>
              {account.seller.online && (
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-white font-medium drop-shadow-md">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              {account.seller.name}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-yellow-400 font-medium bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
            <Star className="w-3 h-3 fill-current" />
            {account.seller.rating} <span className="text-gray-300">({account.seller.reviews})</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-medium text-gray-100 line-clamp-2 leading-snug group-hover:text-primary transition-colors mb-2">
          {account.title}
        </h3>
        
        <button className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-4 w-fit pb-0.5 border-b border-gray-700 hover:border-gray-500 transition-colors">
          Show description
        </button>

        <div className="mt-auto grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
          <div>
            <div className="mb-0.5">Type</div>
            <div className="text-gray-300 font-medium">{account.type}</div>
          </div>
          <div>
            <div className="mb-0.5">Server</div>
            <div className="text-gray-300 font-medium truncate">{account.server}</div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between mt-auto bg-[#131624] -mx-4 -mb-4 px-4 py-3">
          <div className="text-lg font-bold text-white">
            ${account.price}
          </div>
          <div className="w-8 h-8 rounded-lg bg-gray-800/80 flex items-center justify-center group-hover:bg-primary transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default AccountCard;
